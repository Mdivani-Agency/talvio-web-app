import { isValidBlogSlug, type BlogPost, type BlogPostSummary } from './contract';
import type { BlogResult, BlogUnavailableReason } from './server';

/**
 * Freshness and capacity rules for every blog read. The shared cache is injected (`CachedLoad`) so the rules can be
 * tested with a controlled clock and several simulated instances; `reader.ts` wires it to the Next.js data cache.
 * See "Caching and freshness" in `docs/blog-api-contract.md`.
 */

/** End-to-end limit from the upstream validation to any response, including CDN time (MDI-273 decision). */
export const BLOG_FRESHNESS_BUDGET_SECONDS = 300;
/**
 * The list is cached in fixed windows: every request in one window shares one entry, and the first request of the
 * next window loads a new one. Nothing refreshes in the background, so each instance reads the list at most once per
 * window, and a new or removed post shows up within one window. 240 s leaves 60 s of the budget for a fallback.
 */
export const BLOG_LIST_WINDOW_SECONDS = 240;
/** How long the shared cache keeps any entry. List entries are superseded after one window; posts by an edit. */
export const BLOG_CACHE_ENTRY_LIFETIME_SECONDS = 24 * 60 * 60;
/** Longest a CDN may keep a blog response. The header helper also caps it by the data's remaining budget. */
export const BLOG_CDN_MAX_AGE_SECONDS = 60;
/** Upstream requests one instance may have in flight. Each is bounded by the client's 5 s timeout. */
export const BLOG_MAX_CONCURRENT_UPSTREAM = 4;

/** What the shared cache stores: a successful answer and when the API validated it. Nothing else is stored. */
export type BlogCacheEntry<T> = { data: T; fetchedAt: number };

/** `ok` results carry `fetchedAt`, the oldest validation time behind them, for response headers. */
export type BlogCachedResult<T> =
  | { status: 'ok'; data: T; fetchedAt: number }
  | { status: 'not_found' }
  | { status: 'unavailable'; reason: BlogUnavailableReason };

/**
 * A shared cache: returns the stored entry for `key`, calling `load` only on a miss. A thrown error is never stored.
 * The reader picks keys that change before an entry could go stale (time windows, `updated_at`), so the cache's own
 * stale-while-revalidate never runs; `revalidateSeconds` only bounds how long an orphaned entry is kept.
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

/** Thrown inside a cache load so the answer is not stored. */
class BlogUncachedResult extends Error {
  constructor(readonly result: { status: 'not_found' } | { status: 'unavailable'; reason: BlogUnavailableReason }) {
    super(`blog result not cached: ${result.status}`);
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

  /** Calls the API. Only an `ok` answer becomes an entry, timed from before the request was sent. */
  function loader<T>(fetch: () => Promise<BlogResult<T>>): () => Promise<BlogCacheEntry<T>> {
    return async () => {
      // Taken before the request (and before waiting for a slot), so a multi-page list counts from its first page.
      const startedAt = now();
      const result = await limit(fetch);
      if (result.status !== 'ok') {
        throw new BlogUncachedResult(result);
      }
      return { data: result.data, fetchedAt: startedAt };
    };
  }

  /** Reads `key` through the shared cache. If the cache itself fails, reads straight from the API. */
  async function readThrough<T>(key: readonly string[], load: () => Promise<BlogCacheEntry<T>>): Promise<BlogCachedResult<T>> {
    let entry: BlogCacheEntry<T>;
    try {
      try {
        entry = await deps.cachedLoad(key, load, BLOG_CACHE_ENTRY_LIFETIME_SECONDS);
      } catch (error) {
        if (error instanceof BlogUncachedResult) {
          throw error;
        }
        console.error('blog cache: read failed');
        entry = await load();
      }
    } catch (error) {
      if (error instanceof BlogUncachedResult) {
        return error.result;
      }
      throw error;
    }
    return { status: 'ok', data: entry.data, fetchedAt: entry.fetchedAt };
  }

  function isFresh(fetchedAt: number): boolean {
    return now() - fetchedAt < BLOG_FRESHNESS_BUDGET_SECONDS * 1000;
  }

  async function getBlogPosts(): Promise<BlogCachedResult<BlogPostSummary[]>> {
    const scope = deps.scope();
    if (!scope) {
      return { status: 'unavailable', reason: 'not_configured' };
    }
    const window = Math.floor(now() / (BLOG_LIST_WINDOW_SECONDS * 1000));
    const key = [...scope, 'list', String(window)];
    return singleFlight(key, async () => {
      // A window's entry was loaded during that window, so it is never older than one window (240 s) while in use.
      const current = await readThrough(key, loader(deps.fetchAll));
      if (current.status !== 'unavailable') {
        return current;
      }
      // The API is down at the start of a window. The previous window's list may still be inside the budget; use it
      // without asking the API again (a miss there loads nothing).
      const previous = await readThrough<BlogPostSummary[]>([...scope, 'list', String(window - 1)], () =>
        Promise.reject(new BlogUncachedResult(current)),
      );
      return previous.status === 'ok' && isFresh(previous.fetchedAt) ? previous : current;
    });
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
    // removed from the list stops rendering even while its detail entry is still cached. This is also the only
    // negative cache: a new post appears when the next list window loads.
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
    // windows and edits, not with the number of posts. A detail `not_found` (removed between the list and this read)
    // is not stored.
    const key = [...scope, 'post', slug, listed.updatedAt];
    const detail = await singleFlight(key, () => readThrough(key, loader(() => deps.fetchOne(slug))));
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
