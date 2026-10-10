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

function namesSite(tags: readonly string[], key: BlogSiteKey): boolean {
  return siteKeyTags(key).some((tag) => tags.includes(tag));
}

/** A shared post tagged for only one of the two sites is withheld from the other. The backend applies it both ways. */
function withheldFrom(site: BlogSiteKey, tags: readonly string[]): boolean {
  const other = site === THIS_SITE ? OTHER_SITE : THIS_SITE;
  return namesSite(tags, other) && !namesSite(tags, site);
}

export type BlogEligibilityInput = Pick<BlogPostSummaryWire, 'status' | 'sites' | 'tags' | 'published_at'>;

export function isEligibleForTalvio<T extends BlogEligibilityInput>(
  post: T,
  now: Date = new Date(),
): post is T & { published_at: string } {
  if (post.status !== 'published' || !post.sites.includes(THIS_SITE) || withheldFrom(THIS_SITE, post.tags)) {
    return false;
  }
  if (post.published_at === null) {
    return false;
  }
  const publishedAt = Date.parse(post.published_at);
  return Number.isFinite(publishedAt) && publishedAt <= now.getTime();
}

/**
 * Whether the agency site also shows this post (it lists `agency` and its tags do not withhold it there). Such a post
 * is agency-primary: Talvio may render it but canonicalises it to the agency URL (see `seo.ts`). Call it only for a
 * post that is already eligible here, so status and date are known to be published.
 */
export function isAgencyPrimary(post: Pick<BlogPostSummaryWire, 'sites' | 'tags'>): boolean {
  return post.sites.includes(OTHER_SITE) && !withheldFrom(OTHER_SITE, post.tags);
}
