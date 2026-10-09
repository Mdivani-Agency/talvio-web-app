import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  agencyOnlyPost,
  blogErrorResponses,
  emptyListResponse,
  FIXTURE_NOW,
  listEnvelope,
  sharedPost,
  talvioDraftPost,
  talvioListResponse,
  talvioPublishedDetailResponse,
  talvioPublishedPost,
  type BlogPostWire,
} from '@/test/fixtures/blog';

const sentry = vi.hoisted(() => ({ captureMessage: vi.fn() }));
vi.mock('@sentry/nextjs', () => sentry);

import {
  BLOG_API_MAX_BODY_BYTES,
  BLOG_LIST_PAGE_LIMIT,
  fetchAllBlogPosts,
  fetchBlogPost,
  fetchBlogPostPage,
  readBlogApiConfig,
} from './server';

const TOKEN = 'test-read-token-0123456789abcdef0123456789';
const ORIGIN = 'https://blog-api.example.test';
const now = new Date(FIXTURE_NOW);

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
}

function post(slug: string, publishedAt: string, extra: Partial<BlogPostWire> = {}): BlogPostWire {
  return { ...talvioPublishedPost, slug, published_at: publishedAt, ...extra };
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('BLOG_API_BASE_URL', ORIGIN);
  vi.stubEnv('BLOG_API_TOKEN', TOKEN);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  fetchMock.mockReset();
  sentry.captureMessage.mockReset();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('server-only boundary', () => {
  it('imports server-only first, and that package throws outside a server build', () => {
    const source = readFileSync(path.join(__dirname, 'server.ts'), 'utf8');
    expect(source.startsWith("import 'server-only';")).toBe(true);
    // Client bundles resolve the package's default entry, which throws on import.
    const requireFromRepo = createRequire(path.join(process.cwd(), 'package.json'));
    expect(() => requireFromRepo('server-only')).toThrow();
  });

  it('has no public environment variables', () => {
    const source = readFileSync(path.join(__dirname, 'server.ts'), 'utf8');
    expect(source).not.toMatch(/NEXT_PUBLIC_/);
  });
});

describe('readBlogApiConfig', () => {
  it('accepts an https origin and a token of at least 32 bytes', () => {
    expect(readBlogApiConfig({ BLOG_API_BASE_URL: `${ORIGIN}/`, BLOG_API_TOKEN: ` ${TOKEN} ` })).toEqual({
      origin: ORIGIN,
      token: TOKEN,
    });
  });

  it('allows plain http only for a local host', () => {
    expect(readBlogApiConfig({ BLOG_API_BASE_URL: 'http://localhost:3000', BLOG_API_TOKEN: TOKEN })?.origin).toBe(
      'http://localhost:3000',
    );
    expect(readBlogApiConfig({ BLOG_API_BASE_URL: 'http://blog-api.example.test', BLOG_API_TOKEN: TOKEN })).toBeNull();
  });

  it.each([
    ['missing origin', { BLOG_API_TOKEN: TOKEN }],
    ['missing token', { BLOG_API_BASE_URL: ORIGIN }],
    ['short token', { BLOG_API_BASE_URL: ORIGIN, BLOG_API_TOKEN: 'short' }],
    ['origin with a path', { BLOG_API_BASE_URL: `${ORIGIN}/api`, BLOG_API_TOKEN: TOKEN }],
    ['origin with credentials', { BLOG_API_BASE_URL: 'https://user:pass@blog-api.example.test', BLOG_API_TOKEN: TOKEN }],
    ['not a URL', { BLOG_API_BASE_URL: 'blog-api', BLOG_API_TOKEN: TOKEN }],
  ])('rejects %s', (_name, env) => {
    expect(readBlogApiConfig(env)).toBeNull();
  });
});

describe('fetchBlogPost', () => {
  it('requests the Talvio read route with the token, no redirects and no caching', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, talvioPublishedDetailResponse.body));

    const result = await fetchBlogPost('fixture-talvio-published', { now });

    expect(result).toMatchObject({ status: 'ok', data: { slug: 'fixture-talvio-published', content: talvioPublishedPost.content } });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${ORIGIN}/api/talvio/posts/fixture-talvio-published`);
    expect(init?.headers).toEqual({ Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' });
    expect(init?.redirect).toBe('manual');
    expect(init?.cache).toBe('no-store');
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('returns not_found for an invalid slug without calling the API', async () => {
    expect(await fetchBlogPost('../admin', { now })).toEqual({ status: 'not_found' });
    expect(await fetchBlogPost('a'.repeat(81), { now })).toEqual({ status: 'not_found' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns not_found for the API not-found envelope', async () => {
    fetchMock.mockResolvedValue(jsonResponse(404, blogErrorResponses.notFound.body));
    expect(await fetchBlogPost('fixture-missing', { now })).toEqual({ status: 'not_found' });
  });

  it('treats a 404 that is not the API envelope as an outage, not a missing post', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Not Found</html>', { status: 404 }));
    expect(await fetchBlogPost('fixture-talvio-published', { now })).toEqual({
      status: 'unavailable',
      reason: 'unexpected_status',
    });
  });

  it.each([
    ['draft', talvioDraftPost],
    ['agency-only', agencyOnlyPost],
  ])('hides a %s post even if the API returns it', async (_name, wrong) => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true, post: wrong }));
    expect(await fetchBlogPost(wrong.slug, { now })).toEqual({ status: 'not_found' });
    expect(sentry.captureMessage).toHaveBeenCalledWith('blog api returned an ineligible post', expect.anything());
  });

  it('rejects a response for a different slug', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true, post: sharedPost }));
    expect(await fetchBlogPost('fixture-talvio-published', { now })).toEqual({ status: 'unavailable', reason: 'malformed' });
  });

  it.each([
    ['401', blogErrorResponses.unauthorized, 'unauthorized'],
    ['429', blogErrorResponses.rateLimited, 'rate_limited'],
    ['500', blogErrorResponses.detailFailed, 'upstream_error'],
    ['400', blogErrorResponses.invalidSlug, 'unexpected_status'],
  ] as const)('classifies %s as unavailable', async (_status, response, reason) => {
    fetchMock.mockResolvedValue(jsonResponse(response.status, response.body));
    expect(await fetchBlogPost('fixture-talvio-published', { now })).toEqual({ status: 'unavailable', reason });
  });

  it('classifies a redirect without following it', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 308, headers: { location: 'https://elsewhere.test/' } }));
    expect(await fetchBlogPost('fixture-talvio-published', { now })).toEqual({ status: 'unavailable', reason: 'redirect' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('classifies a timeout and a network failure', async () => {
    fetchMock.mockRejectedValueOnce(new DOMException('timed out', 'TimeoutError'));
    expect(await fetchBlogPost('fixture-talvio-published', { now })).toEqual({ status: 'unavailable', reason: 'timeout' });
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
    expect(await fetchBlogPost('fixture-talvio-published', { now })).toEqual({ status: 'unavailable', reason: 'network' });
  });

  it('classifies malformed JSON and a schema mismatch', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{"ok":tru', { status: 200 }));
    expect(await fetchBlogPost('fixture-talvio-published', { now })).toEqual({ status: 'unavailable', reason: 'malformed' });
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { ok: true, post: { ...talvioPublishedPost, sites: 'talvio' } }));
    expect(await fetchBlogPost('fixture-talvio-published', { now })).toEqual({ status: 'unavailable', reason: 'malformed' });
  });

  it('stops reading an oversized body, declared or streamed', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('{}', { status: 200, headers: { 'content-length': String(BLOG_API_MAX_BODY_BYTES + 1) } }),
    );
    expect(await fetchBlogPost('fixture-talvio-published', { now })).toEqual({ status: 'unavailable', reason: 'too_large' });
    fetchMock.mockResolvedValueOnce(new Response('x'.repeat(BLOG_API_MAX_BODY_BYTES + 1), { status: 200 }));
    expect(await fetchBlogPost('fixture-talvio-published', { now })).toEqual({ status: 'unavailable', reason: 'too_large' });
  });

  it('is unavailable, not missing, when the API is not configured', async () => {
    vi.stubEnv('BLOG_API_TOKEN', '');
    expect(await fetchBlogPost('fixture-talvio-published', { now })).toEqual({
      status: 'unavailable',
      reason: 'not_configured',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never logs or reports the token or the article', async () => {
    fetchMock.mockResolvedValue(jsonResponse(429, blogErrorResponses.rateLimited.body));
    await fetchBlogPost('fixture-talvio-published', { now });
    const logged = JSON.stringify([vi.mocked(console.error).mock.calls, sentry.captureMessage.mock.calls]);
    expect(logged).not.toContain(TOKEN);
    expect(logged).not.toContain(talvioPublishedPost.content);
  });
});

describe('fetchBlogPostPage', () => {
  it('sends limit and offset and returns eligible summaries', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, talvioListResponse.body));

    const result = await fetchBlogPostPage({ limit: 100, offset: 0 }, { now });

    expect(fetchMock.mock.calls[0][0]).toBe(`${ORIGIN}/api/talvio/posts?limit=100&offset=0`);
    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      expect(result.data.posts.map((item) => item.slug)).toEqual(talvioListResponse.body.posts.map((item) => item.slug));
      expect(result.data.posts[0]).not.toHaveProperty('content');
    }
  });

  it('rejects a page that does not echo the requested window', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ...talvioListResponse.body, offset: 20 }));
    expect(await fetchBlogPostPage({ limit: 100, offset: 0 }, { now })).toEqual({ status: 'unavailable', reason: 'malformed' });
  });
});

describe('fetchAllBlogPosts', () => {
  it('returns an empty blog only for a successful empty list', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, emptyListResponse.body));
    expect(await fetchAllBlogPosts({ now })).toEqual({ status: 'ok', data: [] });
  });

  it.each([
    ['401', blogErrorResponses.unauthorized, 'unauthorized'],
    ['429', blogErrorResponses.rateLimited, 'rate_limited'],
    ['500', blogErrorResponses.listFailed, 'upstream_error'],
  ] as const)('never turns %s into an empty list', async (_status, response, reason) => {
    fetchMock.mockResolvedValue(jsonResponse(response.status, response.body));
    expect(await fetchAllBlogPosts({ now })).toEqual({ status: 'unavailable', reason });
  });

  it('walks every page until total and sorts by publication date', async () => {
    const posts = Array.from({ length: BLOG_LIST_PAGE_LIMIT + 2 }, (_, index) =>
      post(`fixture-${String(index).padStart(3, '0')}`, `2026-0${1 + (index % 9)}-01T00:00:00.000Z`),
    );
    const total = posts.length;
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, listEnvelope(posts.slice(0, 100), { limit: 100, offset: 0, total })))
      .mockResolvedValueOnce(jsonResponse(200, listEnvelope(posts.slice(100), { limit: 100, offset: 100, total })));

    const result = await fetchAllBlogPosts({ now });

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      `${ORIGIN}/api/talvio/posts?limit=100&offset=0`,
      `${ORIGIN}/api/talvio/posts?limit=100&offset=100`,
    ]);
    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      expect(result.data).toHaveLength(total);
      const dates = result.data.map((item) => item.publishedAt);
      expect(dates).toEqual([...dates].sort().reverse());
    }
  });

  it('reports incomplete when the total changes between pages', async () => {
    const posts = Array.from({ length: 101 }, (_, index) => post(`fixture-${index}`, '2026-09-01T00:00:00.000Z'));
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, listEnvelope(posts.slice(0, 100), { limit: 100, offset: 0, total: 101 })))
      .mockResolvedValueOnce(jsonResponse(200, listEnvelope([], { limit: 100, offset: 100, total: 100 })));
    expect(await fetchAllBlogPosts({ now })).toEqual({ status: 'unavailable', reason: 'incomplete' });
  });

  it('reports incomplete when a page comes back empty before total', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, listEnvelope([], { limit: 100, offset: 0, total: 3 })));
    expect(await fetchAllBlogPosts({ now })).toEqual({ status: 'unavailable', reason: 'incomplete' });
  });

  it('drops ineligible rows but still counts them toward completeness', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, listEnvelope([talvioPublishedPost, talvioDraftPost], { limit: 100, offset: 0, total: 2 })),
    );
    const result = await fetchAllBlogPosts({ now });
    expect(result).toMatchObject({ status: 'ok', data: [{ slug: 'fixture-talvio-published' }] });
    expect(sentry.captureMessage).toHaveBeenCalledWith('blog api returned ineligible posts', expect.anything());
  });

  it('rejects duplicate slugs across pages', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, listEnvelope([talvioPublishedPost, talvioPublishedPost], { limit: 100, offset: 0, total: 2 })),
    );
    expect(await fetchAllBlogPosts({ now })).toEqual({ status: 'unavailable', reason: 'malformed' });
  });
});
