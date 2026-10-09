import type { BlogPostSummaryWire, BlogSiteKey } from './contract';

/**
 * The publication rule for Talvio. The read API applies the same rule in its query (`publishedOnSite` in the
 * landing-page `lib/blog.ts`); Talvio applies it again so a backend regression cannot publish a draft or
 * another site's post. List, detail, metadata and sitemap all go through this function.
 */

const THIS_SITE: BlogSiteKey = 'talvio';
const OTHER_SITE: BlogSiteKey = 'agency';

/** Casings of a site key the backend matches in `tags`. Overlap is the whole tag, so `agency-story` does not match. */
function siteKeyTags(key: BlogSiteKey): string[] {
  return [key, key.charAt(0).toUpperCase() + key.slice(1), key.toUpperCase()];
}

/** A shared post tagged only for the agency site is the agency's, not Talvio's. */
function withheldByTags(tags: readonly string[]): boolean {
  const namesOther = siteKeyTags(OTHER_SITE).some((tag) => tags.includes(tag));
  const namesThis = siteKeyTags(THIS_SITE).some((tag) => tags.includes(tag));
  return namesOther && !namesThis;
}

export type BlogEligibilityInput = Pick<BlogPostSummaryWire, 'status' | 'sites' | 'tags' | 'published_at'>;

export function isEligibleForTalvio<T extends BlogEligibilityInput>(
  post: T,
  now: Date = new Date(),
): post is T & { published_at: string } {
  if (post.status !== 'published' || !post.sites.includes(THIS_SITE) || withheldByTags(post.tags)) {
    return false;
  }
  if (post.published_at === null) {
    return false;
  }
  const publishedAt = Date.parse(post.published_at);
  return Number.isFinite(publishedAt) && publishedAt <= now.getTime();
}
