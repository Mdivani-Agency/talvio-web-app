import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { isValidBlogSlug, type BlogPost } from '@/lib/blog/contract';
import { blogAssetUrl, blogMarkdownOrigins, getBlogPost } from '@/lib/blog/reader';
import {
  BLOG_MISSING_ARTICLE_METADATA,
  blogArticleMetadata,
  blogArticleStructuredData,
} from '@/lib/blog/seo';
import { serializeJsonLd } from '@/lib/structured-data';

import { BlogUnavailableError } from '../blog-unavailable';
import { BlogArticle } from '../views/blog-article';

// Rendered per request through the cached reader, like `/blog`. No `loading.tsx` or Suspense boundary sits above
// this page, so the status is decided before any byte is sent: 404 for a missing post, 500 for an outage.
export const dynamic = 'force-dynamic';

type BlogArticlePageProps = { params: Promise<{ slug: string }> };

/** The eligible post, or a 404 / outage error. Shared with `generateMetadata` through the reader's per-render cache. */
async function loadPost(slug: string): Promise<BlogPost> {
  if (!isValidBlogSlug(slug)) {
    notFound();
  }
  const result = await getBlogPost(slug);
  if (result.status === 'not_found') {
    notFound();
  }
  if (result.status === 'unavailable') {
    throw new BlogUnavailableError(result.reason);
  }
  return result.data;
}

function coverUrl(post: BlogPost): string | null {
  return post.coverImagePath ? blogAssetUrl(post.coverImagePath) : null;
}

export async function generateMetadata({ params }: BlogArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = isValidBlogSlug(slug) ? await getBlogPost(slug) : null;
  if (result?.status !== 'ok') {
    // The page decides the status; metadata never describes a post that is not served.
    return BLOG_MISSING_ARTICLE_METADATA;
  }
  return blogArticleMetadata(result.data, coverUrl(result.data));
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  const post = await loadPost(slug);
  const cover = coverUrl(post);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(blogArticleStructuredData(post, cover)) }} />
      <BlogArticle post={post} origins={blogMarkdownOrigins()} coverUrl={cover} />
    </>
  );
}
