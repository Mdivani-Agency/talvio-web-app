import { beforeEach, describe, expect, it, vi } from 'vitest';

const reader = vi.hoisted(() => ({ getBlogPosts: vi.fn() }));
vi.mock('@/lib/blog/reader', () => reader);

import { BlogUnavailableError } from './blog/blog-unavailable';
import robots from './robots';
import sitemap from './sitemap';

beforeEach(() => {
  reader.getBlogPosts.mockReset();
  delete process.env.SITE_URL;
});

describe('/sitemap.xml', () => {
  it('keeps the public pages, lists /blog and adds articles', async () => {
    reader.getBlogPosts.mockResolvedValue({
      status: 'ok',
      fetchedAt: 0,
      data: [
        {
          slug: 'resume-tips',
          title: 't',
          description: 'd',
          coverImagePath: null,
          tags: [],
          sites: ['talvio'],
          featured: false,
          publishedAt: '2026-09-20T09:00:00.000Z',
          createdAt: '2026-09-20T09:00:00.000Z',
          updatedAt: '2026-09-25T09:00:00.000Z',
        },
      ],
    });
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls).toEqual(expect.arrayContaining(['https://www.talvio.co', 'https://www.talvio.co/templates', 'https://www.talvio.co/blog']));
    expect(urls).toContain('https://www.talvio.co/blog/resume-tips');
  });

  it.each(['upstream_error', 'not_configured', 'rate_limited'] as const)('fails instead of dropping the blog when the reader is unavailable (%s)', async (reason) => {
    reader.getBlogPosts.mockResolvedValue({ status: 'unavailable', reason });
    await expect(sitemap()).rejects.toEqual(new BlogUnavailableError(reason));
  });
});

describe('/robots.txt', () => {
  it('keeps the blog crawlable and points at the canonical sitemap', () => {
    const rules = robots();
    expect(rules.sitemap).toBe('https://www.talvio.co/sitemap.xml');
    const disallow = [rules.rules].flat().flatMap((rule) => [rule.disallow ?? []].flat());
    expect(disallow).toEqual(['/account', '/auth', '/resume', '/api']);
    expect(disallow.some((path) => '/blog/resume-tips'.startsWith(path))).toBe(false);
  });
});
