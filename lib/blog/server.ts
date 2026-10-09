import 'server-only';

import * as Sentry from '@sentry/nextjs';

import {
  blogDetailEnvelopeSchema,
  blogErrorEnvelopeSchema,
  blogListEnvelopeSchema,
  compareBlogPosts,
  isValidBlogSlug,
  toBlogPost,
  toBlogPostSummary,
  type BlogPost,
  type BlogPostSummary,
  type BlogPostSummaryWire,
} from './contract';
import { isEligibleForTalvio } from './eligibility';

/**
 * The only way Talvio reads blog content. Server-only: the token never reaches the browser, and importing this
 * module from a client component fails the build. Responses are not cached here; caching belongs to MDI-275.
 */

export const BLOG_API_TIMEOUT_MS = 5_000;
/** Larger than any post the backend accepts (100 KB write cap) plus a full list page. */
export const BLOG_API_MAX_BODY_BYTES = 1024 * 1024;
/** The API's maximum page size, which stays under Supabase `max_rows`. */
export const BLOG_LIST_PAGE_LIMIT = 100;
/** Pages walked before giving up on a complete list: 2,000 posts, 20 of the API's 120 reads per minute. */
export const BLOG_LIST_MAX_PAGES = 20;
const MIN_TOKEN_BYTES = 32;
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export type BlogUnavailableReason =
  | 'not_configured'
  | 'timeout'
  | 'network'
  | 'redirect'
  | 'unauthorized'
  | 'rate_limited'
  | 'upstream_error'
  | 'unexpected_status'
  | 'too_large'
  | 'malformed'
  | 'incomplete';

/** `not_found` is a real 404. `unavailable` is temporary and must never render as empty or missing content. */
export type BlogResult<T> =
  | { status: 'ok'; data: T }
  | { status: 'not_found' }
  | { status: 'unavailable'; reason: BlogUnavailableReason };

export type BlogListPage = { posts: BlogPostSummary[]; limit: number; offset: number; total: number };

type BlogApiConfig = { origin: string; token: string };

/** Reads `BLOG_API_BASE_URL` and `BLOG_API_TOKEN`. The origin must be https unless it is a local host. */
export function readBlogApiConfig(env: Record<string, string | undefined> = process.env): BlogApiConfig | null {
  const rawUrl = env.BLOG_API_BASE_URL?.trim();
  const token = env.BLOG_API_TOKEN?.trim();
  if (!rawUrl || !token || Buffer.byteLength(token, 'utf8') < MIN_TOKEN_BYTES) {
    return null;
  }
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  const local = LOCAL_HOSTS.has(url.hostname);
  const secure = url.protocol === 'https:' || (local && url.protocol === 'http:');
  const bareOrigin = url.pathname === '/' && !url.search && !url.hash && !url.username && !url.password;
  if (!secure || !bareOrigin) {
    return null;
  }
  return { origin: url.origin, token };
}

function unavailable<T>(reason: BlogUnavailableReason, status?: number): BlogResult<T> {
  // Reason and status only. Never the token, headers, URL query or article content.
  console.error(`blog api: ${reason}`, status ?? '');
  Sentry.captureMessage('blog api unavailable', {
    level: 'warning',
    tags: { area: 'blog-api', reason },
    extra: status === undefined ? undefined : { status },
  });
  return { status: 'unavailable', reason };
}

type RawResponse = { ok: true; status: number; body: unknown } | { ok: false; reason: BlogUnavailableReason; status?: number };

async function readLimitedText(response: Response): Promise<string | null> {
  const declared = Number(response.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > BLOG_API_MAX_BODY_BYTES) {
    await response.body?.cancel();
    return null;
  }
  if (!response.body) {
    return '';
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    size += value.byteLength;
    if (size > BLOG_API_MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function getJson(config: BlogApiConfig, path: string): Promise<RawResponse> {
  let response: Response;
  try {
    response = await fetch(`${config.origin}${path}`, {
      headers: { Authorization: `Bearer ${config.token}`, Accept: 'application/json' },
      // A redirect would carry the token to wherever it points.
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(BLOG_API_TIMEOUT_MS),
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : '';
    return { ok: false, reason: name === 'TimeoutError' || name === 'AbortError' ? 'timeout' : 'network' };
  }

  if (response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400)) {
    await response.body?.cancel();
    return { ok: false, reason: 'redirect', status: response.status };
  }

  let text: string | null;
  try {
    text = await readLimitedText(response);
  } catch (error) {
    const name = error instanceof Error ? error.name : '';
    return { ok: false, reason: name === 'TimeoutError' || name === 'AbortError' ? 'timeout' : 'network' };
  }
  if (text === null) {
    return { ok: false, reason: 'too_large', status: response.status };
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = undefined;
  }
  return { ok: true, status: response.status, body };
}

function failureFor(status: number): BlogUnavailableReason {
  if (status === 401) {
    return 'unauthorized';
  }
  if (status === 429) {
    return 'rate_limited';
  }
  if (status >= 500) {
    return 'upstream_error';
  }
  return 'unexpected_status';
}

/** Keeps eligible rows and reports, without content, any the API should have filtered out. */
function eligibleSummaries(rows: BlogPostSummaryWire[], now: Date): BlogPostSummary[] {
  const eligible = rows.filter((row) => isEligibleForTalvio(row, now));
  if (eligible.length !== rows.length) {
    Sentry.captureMessage('blog api returned ineligible posts', {
      level: 'warning',
      tags: { area: 'blog-api' },
      extra: { count: rows.length - eligible.length },
    });
  }
  return eligible.map(toBlogPostSummary);
}

/** One page of the list, as the API returns it. Prefer `fetchAllBlogPosts` for anything that must be complete. */
export async function fetchBlogPostPage(
  page: { limit: number; offset: number },
  options: { now?: Date } = {},
): Promise<BlogResult<BlogListPage & { rawCount: number }>> {
  const config = readBlogApiConfig();
  if (!config) {
    return unavailable('not_configured');
  }
  const query = new URLSearchParams({ limit: String(page.limit), offset: String(page.offset) });
  const raw = await getJson(config, `/api/talvio/posts?${query}`);
  if (!raw.ok) {
    return unavailable(raw.reason, raw.status);
  }
  if (raw.status !== 200) {
    return unavailable(failureFor(raw.status), raw.status);
  }
  const parsed = blogListEnvelopeSchema.safeParse(raw.body);
  if (
    !parsed.success ||
    parsed.data.limit !== page.limit ||
    parsed.data.offset !== page.offset ||
    parsed.data.posts.length > page.limit
  ) {
    return unavailable('malformed', raw.status);
  }
  const { posts, limit, offset, total } = parsed.data;
  return {
    status: 'ok',
    data: { posts: eligibleSummaries(posts, options.now ?? new Date()), limit, offset, total, rawCount: posts.length },
  };
}

/**
 * Every eligible post, newest first. Walks the pages until `total` rows are seen, so a partial list is reported
 * as unavailable instead of being published as the whole blog. An empty blog is `ok` with no posts.
 */
export async function fetchAllBlogPosts(options: { now?: Date } = {}): Promise<BlogResult<BlogPostSummary[]>> {
  const now = options.now ?? new Date();
  const posts: BlogPostSummary[] = [];
  let seen = 0;
  let total: number | null = null;

  for (let page = 0; page < BLOG_LIST_MAX_PAGES; page += 1) {
    const result = await fetchBlogPostPage({ limit: BLOG_LIST_PAGE_LIMIT, offset: seen }, { now });
    if (result.status !== 'ok') {
      return result.status === 'unavailable' ? result : unavailable('malformed');
    }
    // The catalog changed between pages, or a page came back short: the walk cannot prove completeness.
    if ((total !== null && result.data.total !== total) || (result.data.rawCount === 0 && seen < result.data.total)) {
      return unavailable('incomplete');
    }
    total = result.data.total;
    seen += result.data.rawCount;
    posts.push(...result.data.posts);
    if (seen >= total) {
      break;
    }
  }

  if (total === null || seen !== total) {
    return unavailable('incomplete');
  }
  if (new Set(posts.map((post) => post.slug)).size !== posts.length) {
    return unavailable('malformed');
  }
  return { status: 'ok', data: posts.sort(compareBlogPosts) };
}

/** One eligible post. Invalid, unknown and ineligible slugs are all `not_found`. */
export async function fetchBlogPost(slug: string, options: { now?: Date } = {}): Promise<BlogResult<BlogPost>> {
  if (!isValidBlogSlug(slug)) {
    return { status: 'not_found' };
  }
  const config = readBlogApiConfig();
  if (!config) {
    return unavailable('not_configured');
  }
  const raw = await getJson(config, `/api/talvio/posts/${encodeURIComponent(slug)}`);
  if (!raw.ok) {
    return unavailable(raw.reason, raw.status);
  }
  if (raw.status === 404) {
    // Only the API's own not-found envelope counts. A bare 404 (no route on an older deployment, a CDN page) is an outage.
    return blogErrorEnvelopeSchema.safeParse(raw.body).success
      ? { status: 'not_found' }
      : unavailable('unexpected_status', raw.status);
  }
  if (raw.status !== 200) {
    return unavailable(failureFor(raw.status), raw.status);
  }
  const parsed = blogDetailEnvelopeSchema.safeParse(raw.body);
  if (!parsed.success || parsed.data.post.slug !== slug) {
    return unavailable('malformed', raw.status);
  }
  const post = parsed.data.post;
  if (!isEligibleForTalvio(post, options.now ?? new Date())) {
    Sentry.captureMessage('blog api returned an ineligible post', { level: 'warning', tags: { area: 'blog-api' } });
    return { status: 'not_found' };
  }
  return { status: 'ok', data: toBlogPost(post) };
}
