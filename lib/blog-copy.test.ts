import { describe, expect, it } from 'vitest';

import {
  BLOG_EMPTY_BODY,
  BLOG_LAST_MODIFIED,
  BLOG_PAGE_DESCRIPTION,
  BLOG_PAGE_HEADING,
  BLOG_PAGE_INTRO,
  BLOG_PAGE_TITLE,
  BLOG_PATH,
  BLOG_UNAVAILABLE_BODY,
  blogPostPath,
  blogUpdatedDate,
  formatBlogDate,
} from './blog-copy';

describe('blog copy', () => {
  it('names the page and stays within search snippet lengths', () => {
    expect(BLOG_PATH).toBe('/blog');
    expect(BLOG_PAGE_TITLE).toMatch(/\| Talvio$/);
    expect(BLOG_PAGE_TITLE.length).toBeLessThanOrEqual(60);
    expect(BLOG_PAGE_DESCRIPTION.length).toBeLessThanOrEqual(160);
    expect(BLOG_PAGE_HEADING).toMatch(/blog/i);
  });

  it('makes no product claims beyond what the blog shows', () => {
    const text = [BLOG_PAGE_TITLE, BLOG_PAGE_DESCRIPTION, BLOG_PAGE_INTRO, BLOG_EMPTY_BODY, BLOG_UNAVAILABLE_BODY].join(' ');
    expect(text).not.toMatch(/ATS|guarantee|free|credits|AI/);
  });

  it('dates the copy and formats post dates in UTC', () => {
    expect(BLOG_LAST_MODIFIED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(formatBlogDate('2026-09-20T23:30:00.000Z')).toBe('September 20, 2026');
    expect(formatBlogDate('2026-09-01T00:30:00.000+02:00')).toBe('August 31, 2026');
  });

  it('builds post paths under /blog', () => {
    expect(blogPostPath('resume-tips')).toBe('/blog/resume-tips');
  });

  it('shows an update date only for a change on a later UTC day', () => {
    const publishedAt = '2026-09-20T23:30:00.000Z';
    expect(blogUpdatedDate({ publishedAt, updatedAt: '2026-09-20T23:59:00.000Z' })).toBeNull();
    expect(blogUpdatedDate({ publishedAt, updatedAt: '2026-09-19T08:00:00.000Z' })).toBeNull();
    expect(blogUpdatedDate({ publishedAt, updatedAt: '2026-09-21T00:10:00.000Z' })).toBe('2026-09-21T00:10:00.000Z');
  });
});
