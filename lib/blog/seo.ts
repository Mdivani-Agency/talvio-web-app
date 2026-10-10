import type { Metadata } from 'next';

import { BLOG_BREADCRUMB_HOME, BLOG_BREADCRUMB_INDEX, BLOG_PATH, blogPostPath } from '../blog-copy';
import { PRIVATE_ROBOTS, SHARE_IMAGE, SHARE_OPEN_GRAPH, SHARE_TWITTER } from '../public-metadata';
import { allowPublicIndexing, siteOrigin } from '../site';

import type { BlogPost, BlogPostSummary } from './contract';
import { isAgencyPrimary } from './eligibility';

/**
 * Canonical ownership, metadata and structured data for blog articles (`docs/blog-api-contract.md`, Launch decisions).
 *
 * - A post the agency site also shows is agency-primary: its canonical is the agency URL, it carries no Talvio
 *   publisher, and the sitemap leaves it out. Every other post Talvio serves is Talvio-primary and self-canonicalises.
 * - Canonicals are built from the slug, so query strings and tracking parameters never reach them.
 * - Nothing here names an author: the API has none.
 */

/** Production origin of the agency site. Its blog serves every post it shows at `/blog/{slug}`. */
export const AGENCY_BLOG_ORIGIN = 'https://mdivani.agency';

export type BlogPrimarySite = 'talvio' | 'agency';

export type BlogCanonical = { url: string; primary: BlogPrimarySite };

export function blogCanonical(post: Pick<BlogPostSummary, 'slug' | 'sites' | 'tags'>): BlogCanonical {
  return isAgencyPrimary(post)
    ? { url: `${AGENCY_BLOG_ORIGIN}${blogPostPath(post.slug)}`, primary: 'agency' }
    : { url: `${siteOrigin()}${blogPostPath(post.slug)}`, primary: 'talvio' };
}

/** Whether Talvio's sitemap lists the post: only posts Talvio owns (MDI-279). */
export function isListedInTalvioSitemap(post: Pick<BlogPostSummary, 'sites' | 'tags'>): boolean {
  return !isAgencyPrimary(post);
}

export function blogArticleTitle(title: string): string {
  return `${title} | Talvio`;
}

/** Article metadata from the same post the page renders. `coverUrl` is absolute, or `null` for the shared image. */
export function blogArticleMetadata(post: BlogPost, coverUrl: string | null): Metadata {
  const { url } = blogCanonical(post);
  const title = blogArticleTitle(post.title);
  const images = coverUrl ? [{ url: coverUrl, alt: '' }] : [SHARE_IMAGE];
  return {
    title: { absolute: title },
    description: post.description,
    alternates: { canonical: url },
    robots: allowPublicIndexing() ? { index: true, follow: true } : PRIVATE_ROBOTS,
    openGraph: {
      ...SHARE_OPEN_GRAPH,
      type: 'article',
      url,
      title,
      description: post.description,
      images,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
    },
    twitter: { ...SHARE_TWITTER, title, description: post.description, images },
  };
}

/** Metadata for a slug that is not served: no canonical, no article or social fields, never indexed. */
export const BLOG_MISSING_ARTICLE_METADATA: Metadata = {
  alternates: { canonical: null },
  robots: PRIVATE_ROBOTS,
  openGraph: null,
  twitter: null,
};

/**
 * `BlogPosting` and `BreadcrumbList` from visible, factual data. The breadcrumb describes the Talvio page the reader is
 * on; the posting points at the canonical URL and names Talvio as publisher only when Talvio owns the post.
 */
export function blogArticleStructuredData(post: BlogPost, coverUrl: string | null) {
  const origin = siteOrigin();
  const { url, primary } = blogCanonical(post);
  const pageUrl = `${origin}${blogPostPath(post.slug)}`;

  const posting = {
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline: post.title,
    description: post.description,
    url,
    mainEntityOfPage: url,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    inLanguage: 'en',
    ...(coverUrl ? { image: [coverUrl] } : {}),
    ...(primary === 'talvio'
      ? { publisher: { '@type': 'Organization', '@id': `${origin}/#organization`, name: 'Talvio', url: `${origin}/` } }
      : {}),
  };

  const breadcrumbs = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: BLOG_BREADCRUMB_HOME, item: `${origin}/` },
      { '@type': 'ListItem', position: 2, name: BLOG_BREADCRUMB_INDEX, item: `${origin}${BLOG_PATH}` },
      { '@type': 'ListItem', position: 3, name: post.title, item: pageUrl },
    ],
  };

  return { '@context': 'https://schema.org', '@graph': [posting, breadcrumbs] as const };
}
