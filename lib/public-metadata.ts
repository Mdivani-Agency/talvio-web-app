import type { Metadata, MetadataRoute } from 'next';

import { featureFlags, type FeatureFlags } from './flags';
import { allowPublicIndexing, siteOrigin } from './site';
import { ATS_LAST_MODIFIED, ATS_PAGE_DESCRIPTION, ATS_PAGE_TITLE } from './ats-page-copy';
import { BLOG_LAST_MODIFIED } from './blog-copy';
import { BENEFITS_TITLE, HERO_TITLE, HOME_LAST_MODIFIED } from './homepage-copy';
import { PRIVACY_LAST_MODIFIED, TERMS_LAST_MODIFIED } from './legal-copy';
import { PRICING_LAST_MODIFIED, PRICING_PAGE_DESCRIPTION, PRICING_PAGE_TITLE } from './pricing-page-copy';
import { TEMPLATES_LAST_MODIFIED, TEMPLATES_PAGE_DESCRIPTION, TEMPLATES_PAGE_TITLE } from './templates-page-copy';

export const HOME_TITLE = 'Free PDF resume generator | Talvio Beta';
export const HOME_DESCRIPTION =
  'Create a resume PDF for free. Write your experience once, pick a template and download. 3 new resume PDFs every month, free forever. Now in beta.';

export const TEMPLATES_TITLE = TEMPLATES_PAGE_TITLE;
export const TEMPLATES_DESCRIPTION = TEMPLATES_PAGE_DESCRIPTION;

export const ATS_TITLE = ATS_PAGE_TITLE;
export const ATS_DESCRIPTION = ATS_PAGE_DESCRIPTION;

/** `/pricing` is served only while the `plansPage` flag is on (MDI-398). */
export const PRICING_TITLE = PRICING_PAGE_TITLE;
export const PRICING_DESCRIPTION = PRICING_PAGE_DESCRIPTION;

export const TERMS_TITLE = 'Terms of Service | Talvio';
export const TERMS_DESCRIPTION =
  'The terms for using Talvio, the free PDF resume generator: your account, your content and resume PDFs, optional AI suggestions, and ending your use.';

export const PRIVACY_TITLE = 'Privacy Policy | Talvio';
export const PRIVACY_DESCRIPTION =
  'What personal data Talvio stores, why it is used, who processes it and for how long, and how to ask for a copy, a correction or deletion.';

/**
 * Placeholder share image (1200x630) for every public page: the logo, the homepage headline and the supporting line.
 * Social networks cache images by URL, so a new image gets a new file name (`share-image-v2.png`) and this URL changes with it.
 */
export const SHARE_IMAGE = {
  url: '/share-image-v1.png',
  width: 1200,
  height: 630,
  alt: `Talvio. ${HERO_TITLE}. ${BENEFITS_TITLE}`,
};

/** Open Graph and Twitter fields shared by every page. A segment that sets `openGraph` replaces the parent's, so pages spread these. */
export const SHARE_OPEN_GRAPH = { siteName: 'Talvio', type: 'website', images: [SHARE_IMAGE] } satisfies Metadata['openGraph'];
export const SHARE_TWITTER = { card: 'summary_large_image', images: [SHARE_IMAGE] } satisfies Metadata['twitter'];

/**
 * Every public page that can be indexed. Anonymous `/home` redirects to `/`.
 * Blog articles are not listed here: `app/sitemap.ts` adds the Talvio-primary ones from the blog API.
 */
export const PUBLIC_PAGE_PATHS = ['/', '/templates', '/pricing', '/ats-friendly-resume', '/blog', '/privacy-policy', '/terms'] as const;

export type IndexablePublicPath = (typeof PUBLIC_PAGE_PATHS)[number];

/** The pages indexed under the given flags. `/pricing` redirects and leaves the sitemap while `plansPage` is off. */
export function indexablePublicPaths(flags: Pick<FeatureFlags, 'plansPage'> = featureFlags()): IndexablePublicPath[] {
  return PUBLIC_PAGE_PATHS.filter((path) => path !== '/pricing' || flags.plansPage);
}

/** Canonical indexable pages under the deployed flags. */
export const INDEXABLE_PUBLIC_PATHS: readonly IndexablePublicPath[] = indexablePublicPaths();

/** Date each page's content last changed, for the sitemap. Each date lives in the page's copy module, next to the copy it dates. */
export const PUBLIC_PAGE_LAST_MODIFIED: Record<IndexablePublicPath, string> = {
  '/': HOME_LAST_MODIFIED,
  '/templates': TEMPLATES_LAST_MODIFIED,
  '/pricing': PRICING_LAST_MODIFIED,
  '/ats-friendly-resume': ATS_LAST_MODIFIED,
  '/blog': BLOG_LAST_MODIFIED,
  '/privacy-policy': PRIVACY_LAST_MODIFIED,
  '/terms': TERMS_LAST_MODIFIED,
};

export function publicSitemap(flags: Pick<FeatureFlags, 'plansPage'> = featureFlags()): MetadataRoute.Sitemap {
  const origin = siteOrigin();
  return indexablePublicPaths(flags).map((path) => ({
    url: path === '/' ? origin : `${origin}${path}`,
    lastModified: PUBLIC_PAGE_LAST_MODIFIED[path],
  }));
}

export const PRIVATE_ROBOTS_PREFIXES = ['/account', '/auth', '/resume', '/api'] as const;

export const PRIVATE_ROBOTS: Metadata['robots'] = { index: false, follow: false };

export function publicPageMetadata(path: string, title: string, description: string): Metadata {
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path === '/' ? `${siteOrigin()}/` : path },
    robots: allowPublicIndexing() ? { index: true, follow: true } : PRIVATE_ROBOTS,
    openGraph: { ...SHARE_OPEN_GRAPH, title, description, url: path },
    twitter: { ...SHARE_TWITTER, title, description },
  };
}

export const homeMetadata = publicPageMetadata('/', HOME_TITLE, HOME_DESCRIPTION);
