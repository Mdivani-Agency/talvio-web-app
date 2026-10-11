import type { MetadataRoute } from 'next';

import { BLOG_LAST_MODIFIED, BLOG_PATH } from '../blog-copy';
import { siteOrigin } from '../site';

import type { BlogPostSummary } from './contract';
import { blogCanonical, isListedInTalvioSitemap } from './seo';

/**
 * Adds blog articles to the public sitemap entries. Only Talvio-primary posts are listed, at the same canonical their
 * pages declare, each dated by its real `updated_at`. The `/blog` entry takes the newest listed post's date when that
 * is later than the index copy's own date. Entries are unique by URL; the first one wins.
 */
export function withBlogEntries(
  publicEntries: MetadataRoute.Sitemap,
  posts: readonly BlogPostSummary[],
): MetadataRoute.Sitemap {
  const listed = posts.filter(isListedInTalvioSitemap);
  const indexUrl = `${siteOrigin()}${BLOG_PATH}`;
  // Timestamps may carry offsets, so compare instants, not strings.
  const newestMs = Math.max(...listed.map((post) => Date.parse(post.updatedAt)));
  const newest = Number.isFinite(newestMs) ? new Date(newestMs).toISOString() : null;
  const indexDate = newest && newest.slice(0, 10) > BLOG_LAST_MODIFIED ? newest : BLOG_LAST_MODIFIED;

  const entries: MetadataRoute.Sitemap = [
    ...publicEntries.map((entry) => (entry.url === indexUrl ? { ...entry, lastModified: indexDate } : entry)),
    ...listed.map((post) => ({ url: blogCanonical(post).url, lastModified: post.updatedAt })),
  ];
  const seen = new Set<string>();
  return entries.filter((entry) => !seen.has(entry.url) && seen.add(entry.url));
}
