import { describe, expect, it } from 'vitest';

import {
  allFixturePosts,
  BLOG_POST_KEYS,
  BLOG_SUMMARY_KEYS,
  blogErrorResponses,
  FIXTURE_NOW,
  futureTalvioPost,
  talvioListResponse,
} from './index';

/** Backend slug rule (`SLUG_PATTERN`, `SLUG_MAX_LENGTH` in the landing-page `lib/blog-schema.ts`). */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_MAX_LENGTH = 80;

// Each fixture must be a row the backend could serialize, or the contract tests built on them
// prove nothing. These mirror the `blog_posts` checks and the write API bounds.
describe('blog API fixtures', () => {
  it.each(allFixturePosts.map((post) => [post.slug, post]))('%s has the detail key set', (_slug, post) => {
    expect(Object.keys(post)).toEqual([...BLOG_POST_KEYS]);
  });

  it.each(allFixturePosts.map((post) => [post.slug, post]))('%s satisfies the table checks', (_slug, post) => {
    expect(post.slug).toMatch(SLUG_PATTERN);
    expect(post.slug.length).toBeLessThanOrEqual(SLUG_MAX_LENGTH);
    expect(post.slug).not.toBe('page');
    expect(post.title.length).toBeGreaterThanOrEqual(3);
    expect(post.title.length).toBeLessThanOrEqual(160);
    expect(post.description.length).toBeGreaterThanOrEqual(10);
    expect(post.description.length).toBeLessThanOrEqual(320);
    expect(post.content.length).toBeGreaterThanOrEqual(20);
    expect(new Set(post.sites).size).toBe(post.sites.length);
    if (post.status === 'published') {
      expect(post.published_at).not.toBeNull();
      expect(post.sites.length).toBeGreaterThan(0);
    }
    if (post.cover_image_url !== null) {
      expect(post.cover_image_url.startsWith('/')).toBe(true);
      expect(post.cover_image_url.startsWith('//')).toBe(false);
    }
  });

  it('has unique slugs', () => {
    const slugs = allFixturePosts.map((post) => post.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('lists summaries without content, filtered and ordered as the read API is', () => {
    const { posts, total } = talvioListResponse.body;
    expect(total).toBe(posts.length);
    for (const post of posts) {
      expect(Object.keys(post)).toEqual([...BLOG_SUMMARY_KEYS]);
      expect(post.status).toBe('published');
      expect(post.sites).toContain('talvio');
    }
    const published = posts.map((post) => post.published_at ?? '');
    expect(published).toEqual([...published].sort().reverse());
  });

  it('dates the future fixture after the fixture clock', () => {
    expect(Date.parse(futureTalvioPost.published_at ?? '')).toBeGreaterThan(Date.parse(FIXTURE_NOW));
  });

  it('uses the error envelope for every error response', () => {
    for (const response of Object.values(blogErrorResponses)) {
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.ok).toBe(false);
      expect(Object.keys(response.body.errors)).toHaveLength(1);
    }
  });
});
