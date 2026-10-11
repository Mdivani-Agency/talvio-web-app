import type { MetadataRoute } from 'next';

import { getBlogPosts } from '@/lib/blog/reader';
import { withBlogEntries } from '@/lib/blog/sitemap';
import { publicSitemap } from '@/lib/public-metadata';

import { BlogUnavailableError } from './blog/blog-unavailable';

// Built per request from the cached blog reader, so the sitemap follows the same 300 s freshness budget as the pages.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getBlogPosts();
  if (posts.status === 'unavailable') {
    // A 500, never a 200 sitemap that silently drops every article.
    throw new BlogUnavailableError(posts.reason);
  }
  return withBlogEntries(publicSitemap(), posts.status === 'ok' ? posts.data : []);
}
