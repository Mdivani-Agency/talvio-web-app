import { isValidBlogSlug, type BlogPost, type BlogPostSummary } from './contract';
import type { BlogResult, BlogUnavailableReason } from './server';

/**
 * Freshness and capacity rules for every blog read. The shared cache is injected (`CachedLoad`) so the rules can be
 * tested with a controlled clock and several simulated instances; `reader.ts` wires it to the Next.js data cache.
 * See "Caching and freshness" in `docs/blog-api-contract.md`.
 */

/** End-to-end limit from the upstream validation to any response, including CDN time (MDI-273 decision). */
export const BLOG_FRESHNESS_BUDGET_SECONDS = 300;
/** A not-found answer is trusted only this long, so a newly published slug appears promptly. */
export const BLOG_NOT_FOUND_MAX_AGE_SECONDS = 30;
/**
 * Age at which the shared cache refreshes an entry in the background. Each instance may trigger its own refresh (the
 * data cache has no cross-instance lock), so upstream reads scale with instances x entries / this interval. 240 s
 * leaves 60 s of the budget for the refresh to land before an entry expires.
 */
export const BLOG_CACHE_REVALIDATE_SECONDS = 240;
/** Background refresh age for post entries. They are valid by `updated_at`, so this only bounds stored versions. */
export const BLOG_POST_ENTRY_LIFETIME_SECONDS = 24 * 60 * 60;
/** Longest a CDN may keep a blog response. The header helper also caps it by the data's remaining budget. */
export const BLOG_CDN_MAX_AGE_SECONDS = 60;
/** Upstream requests one instance may have in flight. Each is bounded by the client's 5 s timeout. */
export const BLOG_MAX_CONCURRENT_UPSTREAM = 4;

/** What the shared cache stores: a successful answer and when the API validated it. Failures are never stored. */
export type BlogCacheEntry<T> = { result: { status: 'ok'; data: T } | { status: 'not_found' }; fetchedAt: number };

/** `ok` results carry `fetchedAt`, the oldest validation time behind them, for response headers. */
export type BlogCachedResult<T> =
  | { status: 'ok'; data: T; fetchedAt: number }
  | { status: 'not_found' }
  | { status: 'unavailable'; reason: BlogUnavailableReason };

/**
 * A shared, stale-while-revalidate cache: returns the stored entry for `key` (loading it on a miss) and refreshes it
 * in the background after `revalidateSeconds`. A thrown error is never stored. Entries can be older than
 * `revalidateSeconds`, which is why the reader checks `fetchedAt` itself.
 */
export type CachedLoad = <T>(
  key: readonly string[],
  load: () => Promise<BlogCacheEntry<T>>,
  revalidateSeconds: number,
) => Promise<BlogCacheEntry<T>>;

export type BlogReaderDeps = {
  cachedLoad: CachedLoad;
  fetchAll: () => Promise<BlogResult<BlogPostSummary[]>>;
  fetchOne: (slug: string) => Promise<BlogResult<BlogPost>>;
  /** Separates entries by environment and upstream origin. `null` when the API is not configured. */
  scope: () => readonly string[] | null;
  now?: () => number;
  maxConcurrentUpstream?: number;
};

export type BlogReader = {
  getBlogPosts: () => Promise<BlogCachedResult<BlogPostSummary[]>>;
  getBlogPost: (slug: string) => Promise<BlogCachedResult<BlogPost>>;
};

/** Thrown inside a cache load so the failure is not stored. */
class BlogUnavailableError extends Error {
  constructor(readonly reason: BlogUnavailableReason) {
    super(`blog unavailable: ${reason}`);
  }
}

function createLimiter(max: number) {
  let active = 0;
  const waiting: (() => void)[] = [];
  return async function limit<T>(task: () => Promise<T>): Promise<T> {
    if (active >= max) {
      await new Promise<void>((resolve) => waiting.push(resolve));
    }
    active += 1;
    try {
      return await task();
    } finally {
      active -= 1;
      waiting.shift()?.();
    }
  };
}

export function createBlogReader(deps: BlogReaderDeps): BlogReader {
  const now = deps.now ?? Date.now;
  const limit = createLimiter(deps.maxConcurrentUpstream ?? BLOG_MAX_CONCURRENT_UPSTREAM);
  // Same-instance requests for one key share a single read. The entry is removed when the read settles, so a lock
  // lives no longer than one upstream call (bounded by the client timeout).
  const inFlight = new Map<string, Promise<BlogCachedResult<unknown>>>();

  /** List entries: `ok` for the whole budget. Post entries: `ok` for as long as the list vouches for them. */
  function isFresh(entry: BlogCacheEntry<unknown>, okMaxAgeSeconds: number): boolean {
    const maxAge = entry.result.status === 'ok' ? okMaxAgeSeconds : BLOG_NOT_FOUND_MAX_AGE_SECONDS;
    return now() - entry.fetchedAt < maxAge * 1000;
  }

  function toResult<T>(entry: BlogCacheEntry<T>): BlogCachedResult<T> {
    return entry.result.status === 'ok'
      ? { status: 'ok', data: entry.result.data, fetchedAt: entry.fetchedAt }
      : { status: 'not_found' };
  }

  async function read<T>(
    key: readonly string[],
    fetch: () => Promise<BlogResult<T>>,
    policy: { revalidateSeconds: number; okMaxAgeSeconds: number },
  ): Promise<BlogCachedResult<T>> {
    const load = async (): Promise<BlogCacheEntry<T>> => {
      const result = await limit(fetch);
      if (result.status === 'unavailable') {
        throw new BlogUnavailableError(result.reason);
      }
      // The time is taken after validation, so an entry's age always counts from the API's answer.
      return { result, fetchedAt: now() };
    };

    let entry: BlogCacheEntry<T> | null = null;
    try {
      entry = await deps.cachedLoad(key, load, policy.revalidateSeconds);
    } catch (error) {
      if (error instanceof BlogUnavailableError) {
        return { status: 'unavailable', reason: error.reason };
      }
      // The cache itself failed. Read through to the API rather than failing the page.
      console.error('blog cache: read failed');
    }
    if (entry && isFresh(entry, policy.okMaxAgeSeconds)) {
      return toResult(entry);
    }
    // Missing or past its budget: never serve it, even if the API is down. The shared cache refreshes on its own.
    try {
      return toResult(await load());
    } catch (error) {
      if (error instanceof BlogUnavailableError) {
        return { status: 'unavailable', reason: error.reason };
      }
      throw error;
    }
  }

  function singleFlight<T>(key: readonly string[], run: () => Promise<BlogCachedResult<T>>): Promise<BlogCachedResult<T>> {
    const id = key.join('\u0000');
    const existing = inFlight.get(id);
    if (existing) {
      return existing as Promise<BlogCachedResult<T>>;
    }
    const promise = run().finally(() => inFlight.delete(id));
    inFlight.set(id, promise);
    return promise;
  }

  async function getBlogPosts(): Promise<BlogCachedResult<BlogPostSummary[]>> {
    const scope = deps.scope();
    if (!scope) {
      return { status: 'unavailable', reason: 'not_configured' };
    }
    const key = [...scope, 'list'];
    return singleFlight(key, () =>
      read(key, deps.fetchAll, {
        revalidateSeconds: BLOG_CACHE_REVALIDATE_SECONDS,
        okMaxAgeSeconds: BLOG_FRESHNESS_BUDGET_SECONDS,
      }),
    );
  }

  async function getBlogPost(slug: string): Promise<BlogCachedResult<BlogPost>> {
    if (!isValidBlogSlug(slug)) {
      return { status: 'not_found' };
    }
    const scope = deps.scope();
    if (!scope) {
      return { status: 'unavailable', reason: 'not_configured' };
    }
    // The list decides which slugs exist. Unknown slugs (crawler noise, typos) cost no upstream request, and a post
    // removed from the list stops rendering even while its detail entry is still cached.
    const list = await getBlogPosts();
    if (list.status !== 'ok') {
      return list.status === 'unavailable' ? list : { status: 'not_found' };
    }
    const listed = list.data.find((post) => post.slug === slug);
    if (!listed) {
      return { status: 'not_found' };
    }
    // The backend sets `updated_at` on every write, so a post stored under the `updated_at` that a fresh list still
    // shows is current: the list re-validates it, and its own age does not matter. An edit changes the key, so the
    // new version is fetched once and old versions are never served. Upstream reads therefore scale with list
    // refreshes and edits, not with the number of posts.
    const key = [...scope, 'post', slug, listed.updatedAt];
    const detail = await singleFlight(key, () =>
      read(key, () => deps.fetchOne(slug), {
        revalidateSeconds: BLOG_POST_ENTRY_LIFETIME_SECONDS,
        okMaxAgeSeconds: Number.POSITIVE_INFINITY,
      }),
    );
    if (detail.status !== 'ok') {
      return detail;
    }
    // The list vouches for this version, so its validation time is the response's age.
    return { ...detail, fetchedAt: list.fetchedAt };
  }

  return { getBlogPosts, getBlogPost };
}

/**
 * `Cache-Control` for a public blog response built from data validated at `fetchedAt`. The CDN may keep it only for
 * the part of the freshness budget the data has not used, and never longer than `BLOG_CDN_MAX_AGE_SECONDS`.
 * Browsers always revalidate.
 */
export function blogCacheControl(fetchedAt: number, now: number = Date.now()): string {
  const remaining = Math.floor(BLOG_FRESHNESS_BUDGET_SECONDS - (now - fetchedAt) / 1000);
  const sMaxAge = Math.min(BLOG_CDN_MAX_AGE_SECONDS, remaining);
  return sMaxAge > 0 ? `public, max-age=0, s-maxage=${sMaxAge}` : 'no-store';
}
