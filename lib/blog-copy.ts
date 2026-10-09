/** Copy for the public blog index (`/blog`). Article pages (MDI-277) and their metadata (MDI-278) add their own. */

export const BLOG_PATH = '/blog';

export const BLOG_PAGE_TITLE = 'Resume and job search articles | Talvio';
export const BLOG_PAGE_DESCRIPTION =
  'Articles from Talvio on writing resumes, preparing PDFs for applications and searching for jobs.';

export const BLOG_PAGE_HEADING = 'Talvio blog';
export const BLOG_PAGE_INTRO = 'Articles on writing resumes, preparing them for applications and searching for jobs.';

/** Shown only when the API answered and there are no eligible posts. */
export const BLOG_EMPTY_HEADING = 'No articles yet';
export const BLOG_EMPTY_BODY = 'Check back soon. New articles appear here when they are published.';

export const BLOG_PUBLISHED_LABEL = 'Published';

/** Date of the last change to this copy. The sitemap entry for `/blog` (MDI-279) uses the newest post date instead. */
export const BLOG_LAST_MODIFIED = '2026-10-09';

/** Publication date as shown on cards, fixed to UTC so server and client agree. */
export function formatBlogDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(iso));
}

export function blogPostPath(slug: string): string {
  return `${BLOG_PATH}/${slug}`;
}

/** Shown with a non-200 status when the blog API is unavailable. Never presented as an empty blog. */
export const BLOG_UNAVAILABLE_TITLE = 'The blog is temporarily unavailable';
export const BLOG_UNAVAILABLE_BODY = 'Articles could not be loaded right now. Please try again in a few minutes.';
