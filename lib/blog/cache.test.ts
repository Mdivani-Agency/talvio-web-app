import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  BLOG_CDN_MAX_AGE_SECONDS,
  BLOG_LIST_WINDOW_SECONDS,
  BLOG_MAX_CONCURRENT_UPSTREAM,
  blogCacheControl,
  createBlogReader,
  type BlogCacheEntry,
  type CachedLoad,
} from './cache';
import type { BlogPost, BlogPostSummary } from './contract';
import type { BlogResult } from './server';

const WINDOW_MS = BLOG_LIST_WINDOW_SECONDS * 1000;
/** The start of a list window, so offsets in the tests are offsets into the window. */
const T0 = Math.floor(Date.parse('2026-10-09T12:00:00.000Z') / WINDOW_MS) * WINDOW_MS;
const SCOPE = ['test', 'https://blog-api.example.test'];

function summary(slug: string): BlogPostSummary {
  return {
    slug,
    title: `Title ${slug}`,
    description: `Description of ${slug}`,
    coverImagePath: null,
    tags: [],
    sites: ['talvio'],
    featured: false,
    publishedAt: '2026-09-01T00:00:00.000Z',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  };
}

function post(slug: string, content = `Body of ${slug}`): BlogPost {
  return { ...summary(slug), content };
}

/** A controllable stand-in for the backend: the current catalog, a switch for outages, and call counts. */
class FakeUpstream {
  posts = new Map<string, BlogPost>();
  down: false | 'upstream_error' | 'rate_limited' = false;
  listCalls = 0;
  detailCalls = 0;
  active = 0;
  maxActive = 0;
  delayMs = 0;
  /** Seconds the fake clock moves while a list walk runs, as a slow multi-page walk would. */
  listWalkSeconds = 0;

  /** Like the backend, every write sets `updated_at`. */
  publish(slug: string, content?: string) {
    this.posts.set(slug, { ...post(slug, content), updatedAt: new Date(now).toISOString() });
  }

  private async track<T>(work: () => T): Promise<T> {
    this.active += 1;
    this.maxActive = Math.max(this.maxActive, this.active);
    try {
      if (this.delayMs) {
        await new Promise((resolve) => setTimeout(resolve, this.delayMs));
      }
      return work();
    } finally {
      this.active -= 1;
    }
  }

  fetchAll = (): Promise<BlogResult<BlogPostSummary[]>> => {
    this.listCalls += 1;
    now += this.listWalkSeconds * 1000;
    return this.track(() =>
      this.down
        ? { status: 'unavailable', reason: this.down }
        : { status: 'ok', data: [...this.posts.values()].map((item) => ({ ...summary(item.slug), updatedAt: item.updatedAt })) },
    );
  };

  fetchOne = (slug: string): Promise<BlogResult<BlogPost>> => {
    this.detailCalls += 1;
    return this.track(() => {
      if (this.down) {
        return { status: 'unavailable', reason: this.down };
      }
      const found = this.posts.get(slug);
      return found ? { status: 'ok', data: found } : { status: 'not_found' };
    });
  };
}

/**
 * Models the Next.js data cache on Vercel: one store shared by every instance, stale-while-revalidate after
 * `revalidateSeconds`, failures never stored. Background refreshes are collected so a test can settle them.
 */
class FakeSharedCache {
  store = new Map<string, { entry: BlogCacheEntry<unknown>; storedAt: number }>();
  background: Promise<unknown>[] = [];
  broken = false;

  constructor(private readonly clock: () => number) {}

  cachedLoad: CachedLoad = async <T,>(
    key: readonly string[],
    load: () => Promise<BlogCacheEntry<T>>,
    revalidateSeconds: number,
  ) => {
    if (this.broken) {
      throw new Error('cache store unavailable');
    }
    const id = key.join('|');
    const hit = this.store.get(id);
    if (!hit) {
      const entry = await load();
      this.store.set(id, { entry, storedAt: this.clock() });
      return entry;
    }
    if (this.clock() - hit.storedAt >= revalidateSeconds * 1000) {
      this.background.push(
        load().then(
          (entry) => this.store.set(id, { entry, storedAt: this.clock() }),
          () => undefined,
        ),
      );
    }
    return hit.entry as BlogCacheEntry<T>;
  };

  async settle() {
    const pending = this.background;
    this.background = [];
    await Promise.all(pending);
  }
}

let now = T0;
let upstream: FakeUpstream;
let shared: FakeSharedCache;

function instance(options: { maxConcurrentUpstream?: number } = {}) {
  return createBlogReader({
    cachedLoad: shared.cachedLoad,
    fetchAll: upstream.fetchAll,
    fetchOne: upstream.fetchOne,
    scope: () => SCOPE,
    now: () => now,
    ...options,
  });
}

function advance(seconds: number) {
  now += seconds * 1000;
}

beforeEach(() => {
  now = T0;
  upstream = new FakeUpstream();
  shared = new FakeSharedCache(() => now);
  upstream.publish('first-post');
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('freshness budget', () => {
  it('serves a post until 299 seconds during an outage, then fails closed at 300 and 301', async () => {
    const reader = instance();
    expect(await reader.getBlogPost('first-post')).toMatchObject({ status: 'ok', fetchedAt: T0 });
    upstream.down = 'upstream_error';

    advance(BLOG_LIST_WINDOW_SECONDS - 1); // same window: cached list
    expect(await reader.getBlogPost('first-post')).toMatchObject({ status: 'ok', fetchedAt: T0 });
    advance(1); // new window, API down: the previous window's list is still inside the budget
    expect(await reader.getBlogPost('first-post')).toMatchObject({ status: 'ok', fetchedAt: T0 });

    now = T0 + 299_000;
    expect(await reader.getBlogPost('first-post')).toMatchObject({ status: 'ok', fetchedAt: T0 });
    now = T0 + 300_000;
    expect(await reader.getBlogPost('first-post')).toEqual({ status: 'unavailable', reason: 'upstream_error' });
    now = T0 + 301_000;
    expect(await reader.getBlogPost('first-post')).toEqual({ status: 'unavailable', reason: 'upstream_error' });
    expect(await reader.getBlogPosts()).toEqual({ status: 'unavailable', reason: 'upstream_error' });
  });

  it('loads a new list in each window when the API is up', async () => {
    const reader = instance();
    await reader.getBlogPosts();
    advance(BLOG_LIST_WINDOW_SECONDS);
    expect(await reader.getBlogPosts()).toMatchObject({ status: 'ok', fetchedAt: now });
    expect(upstream.listCalls).toBe(2);
  });

  it('times a list from before its walk started', async () => {
    upstream.listWalkSeconds = 50;
    const reader = instance();
    expect(await reader.getBlogPosts()).toMatchObject({ status: 'ok', fetchedAt: T0 });
  });

  it('shows an edit in the next window', async () => {
    const reader = instance();
    await reader.getBlogPost('first-post');
    advance(1);
    upstream.publish('first-post', 'Edited body');
    expect(await reader.getBlogPost('first-post')).toMatchObject({ data: { content: 'Body of first-post' } });
    advance(BLOG_LIST_WINDOW_SECONDS);
    expect(await reader.getBlogPost('first-post')).toMatchObject({ data: { content: 'Edited body' } });
  });

  it('shows a newly published post in the next window', async () => {
    const reader = instance();
    await reader.getBlogPosts();
    upstream.publish('second-post');
    expect(await reader.getBlogPost('second-post')).toEqual({ status: 'not_found' });
    advance(BLOG_LIST_WINDOW_SECONDS);
    expect(await reader.getBlogPost('second-post')).toMatchObject({ status: 'ok' });
  });

  it.each([
    ['unpublished', () => upstream.posts.delete('first-post')],
    ['removed from Talvio', () => upstream.posts.delete('first-post')],
  ])('drops a post that was %s from the detail and the list in the next window', async (_case, remove) => {
    const reader = instance();
    await reader.getBlogPost('first-post');
    remove();
    advance(BLOG_LIST_WINDOW_SECONDS);
    expect(await reader.getBlogPost('first-post')).toEqual({ status: 'not_found' });
    expect(await reader.getBlogPosts()).toMatchObject({ status: 'ok', data: [] });
  });

  it('never shows a removed post past 300 seconds when the API went down before confirming the removal', async () => {
    const reader = instance();
    await reader.getBlogPost('first-post');
    upstream.posts.delete('first-post');
    upstream.down = 'upstream_error';
    now = T0 + 299_000;
    expect((await reader.getBlogPost('first-post')).status).toBe('ok');
    now = T0 + 300_000;
    expect(await reader.getBlogPost('first-post')).toEqual({ status: 'unavailable', reason: 'upstream_error' });
  });

  it('keeps a post valid across windows without refetching it', async () => {
    const reader = instance();
    await reader.getBlogPost('first-post');
    for (let round = 0; round < 5; round += 1) {
      advance(BLOG_LIST_WINDOW_SECONDS);
      expect(await reader.getBlogPost('first-post')).toMatchObject({ status: 'ok', fetchedAt: now });
    }
    expect(upstream.detailCalls).toBe(1);
  });

  it('fetches an edited post once and never falls back to the old version', async () => {
    const reader = instance();
    await reader.getBlogPost('first-post');
    advance(1);
    upstream.publish('first-post', 'Edited body');
    advance(BLOG_LIST_WINDOW_SECONDS);
    await reader.getBlogPosts(); // the list now carries the new updated_at

    upstream.down = 'upstream_error';
    expect(await reader.getBlogPost('first-post')).toEqual({ status: 'unavailable', reason: 'upstream_error' });
    upstream.down = false;
    expect(await reader.getBlogPost('first-post')).toMatchObject({ data: { content: 'Edited body' } });
    expect(await reader.getBlogPost('first-post')).toMatchObject({ data: { content: 'Edited body' } });
    expect(upstream.detailCalls).toBe(3);
  });

  it('dates a post response from the list that vouches for it', async () => {
    const reader = instance();
    await reader.getBlogPosts();
    advance(100);
    expect(await reader.getBlogPost('first-post')).toMatchObject({ status: 'ok', fetchedAt: T0 });
  });
});

describe('negative and failed reads', () => {
  it('answers an unknown slug from the list without asking the API for the post', async () => {
    const reader = instance();
    expect(await reader.getBlogPost('not-a-post')).toEqual({ status: 'not_found' });
    expect(await reader.getBlogPost('../etc')).toEqual({ status: 'not_found' });
    expect(upstream.detailCalls).toBe(0);
  });

  it('does not store a detail not-found, so a post removed and restored between reads recovers at once', async () => {
    const reader = instance();
    await reader.getBlogPosts();
    const restored = upstream.posts.get('first-post');
    upstream.posts.delete('first-post');
    expect(await reader.getBlogPost('first-post')).toEqual({ status: 'not_found' });
    upstream.posts.set('first-post', restored as BlogPost);
    expect(await reader.getBlogPost('first-post')).toMatchObject({ status: 'ok' });
  });

  it('does not cache a failure, so the next request after an outage recovers', async () => {
    const reader = instance();
    upstream.down = 'rate_limited';
    expect(await reader.getBlogPosts()).toEqual({ status: 'unavailable', reason: 'rate_limited' });
    expect(shared.store.size).toBe(0);
    upstream.down = false;
    expect(await reader.getBlogPost('first-post')).toMatchObject({ status: 'ok' });
  });

  it('never turns an outage into a cached not-found', async () => {
    const reader = instance();
    await reader.getBlogPosts();
    upstream.down = 'upstream_error';
    expect(await reader.getBlogPost('first-post')).toEqual({ status: 'unavailable', reason: 'upstream_error' });
    upstream.down = false;
    expect(await reader.getBlogPost('first-post')).toMatchObject({ status: 'ok' });
  });

  it('reads through to the API when the cache store fails', async () => {
    const reader = instance();
    shared.broken = true;
    expect(await reader.getBlogPost('first-post')).toMatchObject({ status: 'ok' });
    expect([upstream.listCalls, upstream.detailCalls]).toEqual([1, 1]);
  });

  it('reports not_configured without calling the API', async () => {
    const reader = createBlogReader({
      cachedLoad: shared.cachedLoad,
      fetchAll: upstream.fetchAll,
      fetchOne: upstream.fetchOne,
      scope: () => null,
    });
    expect(await reader.getBlogPosts()).toEqual({ status: 'unavailable', reason: 'not_configured' });
    expect(upstream.listCalls).toBe(0);
  });
});

describe('capacity', () => {
  it('coalesces concurrent reads of the same key on one instance', async () => {
    upstream.delayMs = 5;
    const reader = instance();
    const results = await Promise.all(Array.from({ length: 50 }, () => reader.getBlogPost('first-post')));
    expect(results.every((result) => result.status === 'ok')).toBe(true);
    expect([upstream.listCalls, upstream.detailCalls]).toEqual([1, 1]);
  });

  it('keeps upstream concurrency per instance at the limit', async () => {
    upstream.delayMs = 5;
    for (let index = 0; index < 20; index += 1) {
      upstream.publish(`post-${index}`);
    }
    const reader = instance();
    await reader.getBlogPosts();
    await Promise.all(Array.from({ length: 20 }, (_, index) => reader.getBlogPost(`post-${index}`)));
    expect(upstream.maxActive).toBeLessThanOrEqual(BLOG_MAX_CONCURRENT_UPSTREAM);
  });

  it('releases the in-flight lock when a read fails', async () => {
    const reader = instance();
    upstream.down = 'upstream_error';
    await reader.getBlogPosts();
    upstream.down = false;
    expect(await reader.getBlogPosts()).toMatchObject({ status: 'ok' });
  });

  it('shares entries across instances through the shared cache', async () => {
    const instances = [instance(), instance(), instance()];
    await instances[0].getBlogPost('first-post');
    await Promise.all(instances.map((reader) => reader.getBlogPost('first-post')));
    expect([upstream.listCalls, upstream.detailCalls]).toEqual([1, 1]);
  });

  it('makes one list read per window after a quiet period, with no second background read', async () => {
    const reader = instance();
    await reader.getBlogPosts();
    advance(BLOG_LIST_WINDOW_SECONDS * 3 + 30); // nobody read the blog for three windows
    await reader.getBlogPosts();
    await shared.settle();
    expect(upstream.listCalls).toBe(2);
  });

  it('keeps steady-state upstream reads to one list read per instance per window in a simulated launch load', async () => {
    // 50 posts, 4 instances, 10 minutes: steady readers on every post, a crawler hitting every post plus 500 unknown
    // slugs each minute, and an editor publishing one post a minute. Counts upstream requests per minute.
    for (let index = 0; index < 50; index += 1) {
      upstream.publish(`post-${index}`);
    }
    const instances = Array.from({ length: 4 }, () => instance());
    const perMinute: number[] = [];

    for (let minute = 0; minute < 10; minute += 1) {
      const before = upstream.listCalls + upstream.detailCalls;
      upstream.publish(`new-${minute}`);
      for (let tick = 0; tick < 6; tick += 1) {
        const requests: Promise<unknown>[] = [];
        for (const [index, reader] of instances.entries()) {
          requests.push(reader.getBlogPosts());
          for (let slug = 0; slug < 50; slug += 1) {
            requests.push(reader.getBlogPost(`post-${slug}`));
          }
          for (let junk = 0; junk < 500 / 6 / instances.length; junk += 1) {
            requests.push(reader.getBlogPost(`unknown-${minute}-${tick}-${index}-${junk}`));
          }
        }
        await Promise.all(requests);
        await shared.settle();
        advance(10);
      }
      perMinute.push(upstream.listCalls + upstream.detailCalls - before);
    }

    // Cold start: every instance may fill the shared cache at once (no cross-instance lock), so up to
    // instances x (list + posts). After that only list windows and edits reach the API.
    expect(perMinute[0]).toBeLessThanOrEqual(instances.length * (1 + 50));
    expect(Math.max(...perMinute.slice(1))).toBeLessThanOrEqual(instances.length);
  });
});

describe('blogCacheControl', () => {
  it('caps CDN time by the remaining budget and never lets a response outlive it', () => {
    expect(blogCacheControl(T0, T0)).toBe(`public, max-age=0, s-maxage=${BLOG_CDN_MAX_AGE_SECONDS}`);
    expect(blogCacheControl(T0, T0 + 270_000)).toBe('public, max-age=0, s-maxage=30');
    expect(blogCacheControl(T0, T0 + 299_000)).toBe('public, max-age=0, s-maxage=1');
    expect(blogCacheControl(T0, T0 + 300_000)).toBe('no-store');
    expect(blogCacheControl(T0, T0 + 301_000)).toBe('no-store');
  });
});
