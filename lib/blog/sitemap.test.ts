import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { BLOG_LAST_MODIFIED } from '../blog-copy';
import { publicSitemap } from '../public-metadata';

import type { BlogPostSummary } from './contract';
import { withBlogEntries } from './sitemap';

function post(slug: string, updatedAt: string, extra: Partial<BlogPostSummary> = {}): BlogPostSummary {
  return {
    slug,
    title: slug,
    description: slug,
    coverImagePath: null,
    tags: [],
    sites: ['talvio'],
    featured: false,
    publishedAt: '2026-09-01T09:00:00.000Z',
    createdAt: '2026-09-01T09:00:00.000Z',
    updatedAt,
    ...extra,
  };
}

const previousSite = process.env.SITE_URL;
beforeEach(() => {
  delete process.env.SITE_URL;
});
afterEach(() => {
  if (previousSite === undefined) {
    delete process.env.SITE_URL;
  } else {
    process.env.SITE_URL = previousSite;
  }
});

describe('withBlogEntries', () => {
  const base = publicSitemap({ plansPage: false });

  it('keeps every public entry and adds each Talvio-primary article once, dated by updated_at', () => {
    const entries = withBlogEntries(base, [
      post('talvio-only', '2026-09-20T09:00:00.000Z'),
      post('shared-for-talvio', '2026-09-21T09:00:00.000Z', { sites: ['agency', 'talvio'], tags: ['talvio'] }),
      post('talvio-only', '2026-09-20T09:00:00.000Z'),
    ]);
    expect(entries.slice(0, base.length).map((entry) => entry.url)).toEqual(base.map((entry) => entry.url));
    expect(entries.slice(base.length)).toEqual([
      { url: 'https://www.talvio.co/blog/talvio-only', lastModified: '2026-09-20T09:00:00.000Z' },
      { url: 'https://www.talvio.co/blog/shared-for-talvio', lastModified: '2026-09-21T09:00:00.000Z' },
    ]);
    expect(new Set(entries.map((entry) => entry.url)).size).toBe(entries.length);
  });

  it('leaves agency-primary posts out', () => {
    const entries = withBlogEntries(base, [post('shared', '2026-09-20T09:00:00.000Z', { sites: ['agency', 'talvio'] })]);
    expect(entries.map((entry) => entry.url).join(' ')).not.toContain('/blog/shared');
  });

  it('dates /blog by the newest listed post when it is later than the index copy', () => {
    const blog = (entries: ReturnType<typeof withBlogEntries>) => entries.find((entry) => entry.url === 'https://www.talvio.co/blog');
    expect(blog(withBlogEntries(base, []))?.lastModified).toBe(BLOG_LAST_MODIFIED);
    expect(blog(withBlogEntries(base, [post('old', '2026-01-01T00:00:00.000Z')]))?.lastModified).toBe(BLOG_LAST_MODIFIED);
    expect(blog(withBlogEntries(base, [post('new', '2027-01-02T00:00:00.000Z'), post('older', '2026-12-01T00:00:00.000Z')]))?.lastModified).toBe(
      '2027-01-02T00:00:00.000Z',
    );
    // Offsets are compared as instants: 00:30+02:00 on the 11th is 22:30Z on the 10th.
    expect(
      blog(withBlogEntries(base, [post('offset', '2027-03-11T00:30:00+02:00'), post('utc', '2027-03-10T23:00:00.000Z')]))?.lastModified,
    ).toBe('2027-03-10T23:00:00.000Z');
    expect(blog(withBlogEntries(base, [post('offset', '2027-03-11T00:30:00+02:00')]))?.lastModified).toBe('2027-03-10T22:30:00.000Z');
    // An agency-primary post does not date Talvio's index.
    expect(blog(withBlogEntries(base, [post('shared', '2027-05-01T00:00:00.000Z', { sites: ['agency', 'talvio'] })]))?.lastModified).toBe(
      BLOG_LAST_MODIFIED,
    );
  });
});
