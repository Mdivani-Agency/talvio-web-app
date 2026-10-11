import { describe, expect, it } from 'vitest';

import { blogErrorResponses, talvioListResponse, talvioPublishedDetailResponse, talvioPublishedPost } from '@/test/fixtures/blog';

import {
  blogDetailEnvelopeSchema,
  blogErrorEnvelopeSchema,
  blogListEnvelopeSchema,
  compareBlogPosts,
  isValidBlogSlug,
  toBlogPost,
  type BlogPostSummary,
} from './contract';

describe('isValidBlogSlug', () => {
  it('accepts the backend slug format up to 80 characters', () => {
    expect(isValidBlogSlug('a')).toBe(true);
    expect(isValidBlogSlug('resume-tips-2026')).toBe(true);
    expect(isValidBlogSlug('a'.repeat(80))).toBe(true);
  });

  it.each(['', 'A', 'a--b', '-a', 'a-', 'a_b', 'a/b', '../a', 'a%2Fb', 'a'.repeat(81)])('rejects %j', (slug) => {
    expect(isValidBlogSlug(slug)).toBe(false);
  });
});

describe('wire schemas', () => {
  it('accept the fixture envelopes', () => {
    expect(blogListEnvelopeSchema.safeParse(talvioListResponse.body).success).toBe(true);
    expect(blogDetailEnvelopeSchema.safeParse(talvioPublishedDetailResponse.body).success).toBe(true);
    for (const response of Object.values(blogErrorResponses)) {
      expect(blogErrorEnvelopeSchema.safeParse(response.body).success).toBe(true);
    }
  });

  it('reject a post with a field of the wrong type', () => {
    const result = blogDetailEnvelopeSchema.safeParse({ ok: true, post: { ...talvioPublishedPost, featured: 'yes' } });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path)).toEqual([['post', 'featured']]);
  });

  it('reject an unknown site, an unknown status, a bad date and an empty or blank body', () => {
    const post = talvioPublishedPost;
    const cases = [
      [{ ...post, sites: ['other'] }, ['post', 'sites', 0]],
      [{ ...post, status: 'scheduled' }, ['post', 'status']],
      [{ ...post, updated_at: '21 Sep 2026' }, ['post', 'updated_at']],
      [{ ...post, content: '' }, ['post', 'content']],
      [{ ...post, content: ' \n\t ' }, ['post', 'content']],
    ] as const;
    for (const [bad, path] of cases) {
      const result = blogDetailEnvelopeSchema.safeParse({ ok: true, post: bad });
      expect(result.error?.issues.map((issue) => issue.path)).toEqual([path]);
    }
  });

  it.each([
    'https://elsewhere.test/cover.png',
    '//elsewhere.test/cover.png',
    'cover.png',
    '/assets/../secret.png',
    '/assets/cover.png?w=1',
    '/assets/cover.png#x',
    '/assets\\cover.png',
  ])('reject the cover %j, which is not a same-origin path', (cover) => {
    const result = blogDetailEnvelopeSchema.safeParse({ ok: true, post: { ...talvioPublishedPost, cover_image_url: cover } });
    expect(result.error?.issues.map((issue) => issue.path)).toEqual([['post', 'cover_image_url']]);
  });

  it('accept a same-origin cover path or no cover', () => {
    for (const cover of ['/assets/blog/cover.png', null]) {
      const result = blogDetailEnvelopeSchema.safeParse({ ok: true, post: { ...talvioPublishedPost, cover_image_url: cover } });
      expect(result.success).toBe(true);
    }
  });

  it('reject a list without its pagination fields', () => {
    const withoutTotal: Record<string, unknown> = { ...talvioListResponse.body };
    delete withoutTotal.total;
    expect(blogListEnvelopeSchema.safeParse(withoutTotal).error?.issues.map((issue) => issue.path)).toEqual([['total']]);
  });
});

describe('mapping and order', () => {
  it('maps snake_case to the domain shape once', () => {
    expect(toBlogPost({ ...talvioPublishedPost, published_at: '2026-09-20T09:00:00.000Z' })).toEqual({
      slug: 'fixture-talvio-published',
      title: talvioPublishedPost.title,
      description: talvioPublishedPost.description,
      content: talvioPublishedPost.content,
      coverImagePath: '/assets/blog/fixture-cover.png',
      tags: ['resume'],
      sites: ['talvio'],
      featured: false,
      publishedAt: '2026-09-20T09:00:00.000Z',
      createdAt: '2026-09-19T15:30:00.000Z',
      updatedAt: '2026-09-21T08:00:00.000Z',
    });
  });

  it('sorts newest first, then by slug', () => {
    const post = (slug: string, publishedAt: string) => ({ slug, publishedAt }) as BlogPostSummary;
    const sorted = [post('b', '2026-09-01T00:00:00Z'), post('c', '2026-09-02T00:00:00Z'), post('a', '2026-09-01T00:00:00Z')]
      .sort(compareBlogPosts)
      .map((item) => item.slug);
    expect(sorted).toEqual(['c', 'a', 'b']);
  });
});
