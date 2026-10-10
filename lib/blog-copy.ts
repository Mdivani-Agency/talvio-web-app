/** Copy for the public blog index (`/blog`) and article pages (`/blog/[slug]`). Article metadata belongs to MDI-278. */

export const BLOG_PATH = '/blog';

export const BLOG_PAGE_TITLE = 'Resume and job search articles | Talvio';
export const BLOG_PAGE_DESCRIPTION =
  'Articles from Talvio on writing resumes, preparing resume PDFs for job applications and searching for jobs. New articles appear here as they are published.';

export const BLOG_PAGE_HEADING = 'Talvio blog';
export const BLOG_PAGE_INTRO = 'Articles on writing resumes, preparing them for applications and searching for jobs.';

/** Shown only when the API answered and there are no eligible posts. */
export const BLOG_EMPTY_HEADING = 'No articles yet';
export const BLOG_EMPTY_BODY = 'Check back soon. New articles appear here when they are published.';

export const BLOG_PUBLISHED_LABEL = 'Published';

/** Date of the last change to this copy. The `/blog` sitemap entry uses the newest post date when that is later. */
export const BLOG_LAST_MODIFIED = '2026-10-10';

/** Publication date as shown on cards, fixed to UTC so server and client agree. */
export function formatBlogDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(iso));
}

export function blogPostPath(slug: string): string {
  return `${BLOG_PATH}/${slug}`;
}

/**
 * The update date worth showing: only when the post changed on a later UTC day than it was published. Same-day edits
 * and timestamps before publication (an edit made while it was a draft) are not shown.
 */
export function blogUpdatedDate(post: { publishedAt: string; updatedAt: string }): string | null {
  const day = (iso: string) => new Date(iso).toISOString().slice(0, 10);
  return day(post.updatedAt) > day(post.publishedAt) ? post.updatedAt : null;
}

export const BLOG_UPDATED_LABEL = 'Updated';
export const BLOG_BREADCRUMB_LABEL = 'Breadcrumb';
export const BLOG_BREADCRUMB_HOME = 'Home';
export const BLOG_BREADCRUMB_INDEX = 'Blog';

/** Shown with a non-200 status when the blog API is unavailable. Never presented as an empty blog. */
export const BLOG_UNAVAILABLE_TITLE = 'The blog is temporarily unavailable';
export const BLOG_UNAVAILABLE_BODY = 'Articles could not be loaded right now. Please try again in a few minutes.';
