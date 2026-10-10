import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { BlogPost } from '@/lib/blog/contract';

const reader = vi.hoisted(() => ({
  getBlogPost: vi.fn(),
  blogAssetUrl: vi.fn((path: string) => `https://blog-api.example.test${path}`),
  blogMarkdownOrigins: vi.fn(() => ({ contentOrigin: 'https://blog-api.example.test', siteOrigin: 'https://www.talvio.co' })),
}));
vi.mock('@/lib/blog/reader', () => reader);

import { BlogUnavailableError } from '../blog-unavailable';
import BlogArticlePage, { generateMetadata } from './page';

const post: BlogPost = {
  slug: 'resume-tips',
  title: 'Resume tips',
  description: 'How to write a resume.',
  content: '# Intro\n\nBody **text**.\n\n## Details\n\nMore.',
  coverImagePath: '/uploads/cover.png',
  tags: [],
  sites: ['talvio'],
  featured: false,
  publishedAt: '2026-09-20T09:00:00.000Z',
  createdAt: '2026-09-19T09:00:00.000Z',
  updatedAt: '2026-09-25T09:00:00.000Z',
};

const props = (slug: string) => ({ params: Promise.resolve({ slug }) });

async function render(slug: string) {
  return renderToStaticMarkup(await BlogArticlePage(props(slug)));
}

/** `notFound()` throws an error whose digest carries the 404 status. */
async function expectNotFound(promise: Promise<unknown>) {
  await expect(promise).rejects.toMatchObject({ digest: expect.stringMatching(/;404$/) });
}

beforeEach(() => {
  reader.getBlogPost.mockReset();
});

describe('/blog/[slug]', () => {
  it('renders one h1, breadcrumbs, dates, the body and the product CTA', async () => {
    reader.getBlogPost.mockResolvedValue({ status: 'ok', data: post, fetchedAt: 0 });
    const html = await render('resume-tips');

    expect(reader.getBlogPost).toHaveBeenCalledWith('resume-tips');
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*>Resume tips<\/h1>/);
    expect(html).toMatch(/<nav aria-label="Breadcrumb"/);
    expect(html).toContain('href="/blog"');
    expect(html).toContain('<time dateTime="2026-09-20T09:00:00.000Z">September 20, 2026</time>');
    expect(html).toContain('<time dateTime="2026-09-25T09:00:00.000Z">September 25, 2026</time>');
    expect(html).toContain('<strong>text</strong>');
    expect(html).toMatch(/<h2[^>]*>Intro<\/h2>/);
    expect(html).toContain('src="https://blog-api.example.test/uploads/cover.png"');
    expect(html).toContain('href="/auth/sign-in"');
  });

  it('hides an update made on the publication day', async () => {
    reader.getBlogPost.mockResolvedValue({
      status: 'ok',
      data: { ...post, coverImagePath: null, updatedAt: '2026-09-20T18:00:00.000Z' },
      fetchedAt: 0,
    });
    const html = await render('resume-tips');
    expect(html.match(/<time/g)).toHaveLength(1);
    expect(html).not.toContain('<img');
  });

  it.each(['Resume-Tips', 'a--b', 'x'.repeat(81), '..', 'post%2F..'])('returns 404 for the invalid slug %j without a read', async (slug) => {
    await expectNotFound(BlogArticlePage(props(slug)));
    expect(reader.getBlogPost).not.toHaveBeenCalled();
  });

  it('returns 404 for a missing or ineligible post', async () => {
    reader.getBlogPost.mockResolvedValue({ status: 'not_found' });
    await expectNotFound(BlogArticlePage(props('agency-only')));
  });

  it.each(['upstream_error', 'rate_limited', 'malformed', 'not_configured'] as const)(
    'throws the outage error instead of a 404 when the reader is unavailable (%s)',
    async (reason) => {
      reader.getBlogPost.mockResolvedValue({ status: 'unavailable', reason });
      await expect(BlogArticlePage(props('resume-tips'))).rejects.toEqual(new BlogUnavailableError(reason));
    },
  );
});

describe('generateMetadata', () => {
  it('describes the served post with its canonical and cover, from the same read as the page', async () => {
    reader.getBlogPost.mockResolvedValue({ status: 'ok', data: post, fetchedAt: 0 });
    const metadata = await generateMetadata(props('resume-tips'));
    expect(metadata.title).toEqual({ absolute: 'Resume tips | Talvio' });
    expect(metadata.description).toBe(post.description);
    expect(metadata.alternates).toEqual({ canonical: 'https://www.talvio.co/blog/resume-tips' });
    expect(metadata.openGraph).toMatchObject({ type: 'article', images: [{ url: 'https://blog-api.example.test/uploads/cover.png' }] });
    expect(reader.getBlogPost).toHaveBeenCalledWith('resume-tips');
  });

  it.each([
    [{ status: 'not_found' }],
    [{ status: 'unavailable', reason: 'timeout' }],
  ])('describes nothing for %j', async (result) => {
    reader.getBlogPost.mockResolvedValue(result);
    const metadata = await generateMetadata(props('resume-tips'));
    expect(metadata).toEqual({ alternates: { canonical: null }, robots: { index: false, follow: false }, openGraph: null, twitter: null });
  });

  it('describes nothing for an invalid slug without a read', async () => {
    const metadata = await generateMetadata(props('Not_A_Slug'));
    expect(metadata.openGraph).toBeNull();
    expect(reader.getBlogPost).not.toHaveBeenCalled();
  });
});

describe('structured data', () => {
  it('renders one BlogPosting and one BreadcrumbList that agree with the canonical', async () => {
    reader.getBlogPost.mockResolvedValue({ status: 'ok', data: post, fetchedAt: 0 });
    const html = await render('resume-tips');
    const scripts = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
    expect(scripts).toHaveLength(1);
    const [posting, breadcrumbs] = scripts[0]['@graph'];
    expect(posting).toMatchObject({ '@type': 'BlogPosting', url: 'https://www.talvio.co/blog/resume-tips', headline: 'Resume tips' });
    expect(breadcrumbs['@type']).toBe('BreadcrumbList');
  });
});
