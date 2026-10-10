import 'server-only';

import { unstable_cache } from 'next/cache';
import { cache } from 'react';

import { siteOrigin } from '../site';

import { createBlogReader, type BlogCacheEntry, type CachedLoad } from './cache';
import type { BlogMarkdownOrigins } from './markdown-urls';
import { fetchAllBlogPosts, fetchBlogPost, readBlogApiConfig } from './server';

/**
 * The cached blog reader that pages, metadata, the sitemap and feeds use. Nothing else should call `server.ts`.
 *
 * The shared cache is the Next.js data cache (`unstable_cache`), which Vercel shares across instances and
 * deployments. Entries are keyed by environment and API origin, never by anything from the request, and hold only
 * public content. Pages that call this must render per request (no ISR), because the data cache's age is the only
 * age the freshness budget accounts for. Next.js marks those pages `no-store`, so no CDN copy outlives it either.
 */

const cachedLoad: CachedLoad = <T>(
  key: readonly string[],
  load: () => Promise<BlogCacheEntry<T>>,
  revalidateSeconds: number,
) => unstable_cache(load, ['talvio-blog', ...key], { revalidate: revalidateSeconds, tags: ['talvio-blog'] })();

const reader = createBlogReader({
  cachedLoad,
  fetchAll: () => fetchAllBlogPosts(),
  fetchOne: (slug) => fetchBlogPost(slug),
  scope: () => {
    const config = readBlogApiConfig();
    return config ? [process.env.VERCEL_ENV ?? 'local', config.origin] : null;
  },
});

/** Every eligible post, newest first. Deduplicated within one render. */
export const getBlogPosts = cache(reader.getBlogPosts);

/** One eligible post, or `not_found`. Deduplicated within one render, so a page and its metadata share one read. */
export const getBlogPost = cache(reader.getBlogPost);

export { blogCacheControl, BLOG_FRESHNESS_BUDGET_SECONDS, type BlogCachedResult } from './cache';

/**
 * Absolute URL for a cover path. Covers are same-origin paths on the API origin (checked in `contract.ts`), so they
 * resolve against it, never against Talvio. `null` when the API is not configured.
 */
export function blogAssetUrl(path: string): string | null {
  const config = readBlogApiConfig();
  return config ? `${config.origin}${path}` : null;
}

/** Origins article Markdown may link to and load images from (see `markdown-urls.ts`). */
export function blogMarkdownOrigins(): BlogMarkdownOrigins {
  return { contentOrigin: readBlogApiConfig()?.origin ?? null, siteOrigin: siteOrigin() };
}
