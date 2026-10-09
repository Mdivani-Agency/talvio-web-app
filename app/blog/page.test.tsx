import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BLOG_EMPTY_HEADING, BLOG_PAGE_HEADING } from '@/lib/blog-copy';
import type { BlogPostSummary } from '@/lib/blog/contract';

const reader = vi.hoisted(() => ({
  getBlogPosts: vi.fn(),
  blogAssetUrl: vi.fn((path: string) => `https://blog-api.example.test${path}`),
}));
vi.mock('@/lib/blog/reader', () => reader);

import { BlogUnavailableError } from './blog-unavailable';
import BlogPage from './page';

function summary(slug: string, publishedAt: string, extra: Partial<BlogPostSummary> = {}): BlogPostSummary {
  return {
    slug,
    title: `Title ${slug}`,
    description: `Description of ${slug}`,
    coverImagePath: null,
    tags: [],
    sites: ['talvio'],
    featured: false,
    publishedAt,
    createdAt: publishedAt,
    updatedAt: publishedAt,
    ...extra,
  };
}

async function renderPage() {
  return renderToStaticMarkup(await BlogPage());
}

beforeEach(() => {
  reader.getBlogPosts.mockReset();
});

describe('/blog', () => {
  it('renders one h1 and a crawlable link per post, in the reader order', async () => {
    // The reader returns posts newest first with a slug tie-break; the page must not reorder or drop any.
    const posts = [
      summary('newest', '2026-09-20T09:00:00.000Z', { featured: true }),
      summary('same-day-a', '2026-09-10T09:00:00.000Z'),
      summary('same-day-b', '2026-09-10T09:00:00.000Z'),
      summary('oldest', '2026-09-01T09:00:00.000Z'),
    ];
    reader.getBlogPosts.mockResolvedValue({ status: 'ok', data: posts, fetchedAt: 0 });

    const html = await renderPage();

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain(BLOG_PAGE_HEADING);
    expect([...html.matchAll(/href="(\/blog\/[^"]+)"/g)].map((match) => match[1])).toEqual([
      '/blog/newest',
      '/blog/same-day-a',
      '/blog/same-day-b',
      '/blog/oldest',
    ]);
    expect(html).toContain('<time dateTime="2026-09-20T09:00:00.000Z">September 20, 2026</time>');
    expect(html).not.toContain(BLOG_EMPTY_HEADING);
  });

  it('shows a featured post once, in date order', async () => {
    reader.getBlogPosts.mockResolvedValue({
      status: 'ok',
      data: [summary('first', '2026-09-20T09:00:00.000Z'), summary('featured', '2026-09-10T09:00:00.000Z', { featured: true })],
      fetchedAt: 0,
    });
    const html = await renderPage();
    expect(html.match(/href="\/blog\/featured"/g)).toHaveLength(1);
    expect(html.indexOf('/blog/first')).toBeLessThan(html.indexOf('/blog/featured'));
  });

  it('resolves a cover against the API origin and leaves posts without one image-free', async () => {
    reader.getBlogPosts.mockResolvedValue({
      status: 'ok',
      data: [
        summary('with-cover', '2026-09-20T09:00:00.000Z', { coverImagePath: '/assets/cover.png' }),
        summary('without-cover', '2026-09-10T09:00:00.000Z'),
      ],
      fetchedAt: 0,
    });
    const html = await renderPage();
    expect(html).toContain('src="https://blog-api.example.test/assets/cover.png"');
    expect(html.match(/<img/g)).toHaveLength(1);
    expect(html).toMatch(/<img[^>]*alt=""/);
  });

  it('renders the empty state only for a successful empty list', async () => {
    reader.getBlogPosts.mockResolvedValue({ status: 'ok', data: [], fetchedAt: 0 });
    const html = await renderPage();
    expect(html).toContain(BLOG_EMPTY_HEADING);
    expect(html).not.toMatch(/href="\/blog\//);
  });

  it.each(['upstream_error', 'rate_limited', 'incomplete', 'not_configured'] as const)(
    'throws instead of rendering an empty blog when the reader is unavailable (%s)',
    async (reason) => {
      reader.getBlogPosts.mockResolvedValue({ status: 'unavailable', reason });
      await expect(BlogPage()).rejects.toEqual(new BlogUnavailableError(reason));
    },
  );
});
