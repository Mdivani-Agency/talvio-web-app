import type { Metadata, MetadataRoute } from 'next';

import { allowPublicIndexing, siteOrigin } from './site';
import { ATS_PAGE_DESCRIPTION, ATS_PAGE_TITLE } from './ats-page-copy';
import { BENEFITS_TITLE, HERO_TITLE } from './homepage-copy';
import { PRICING_PAGE_DESCRIPTION, PRICING_PAGE_TITLE } from './pricing-page-copy';
import { TEMPLATES_PAGE_DESCRIPTION, TEMPLATES_PAGE_TITLE } from './templates-page-copy';

export const HOME_TITLE = 'Free PDF resume generator | Talvio Beta';
export const HOME_DESCRIPTION =
  'Create a resume PDF for free. Write your experience once, pick a template and download. 3 new resume PDFs every month, free forever. Now in beta.';

export const TEMPLATES_TITLE = TEMPLATES_PAGE_TITLE;
export const TEMPLATES_DESCRIPTION = TEMPLATES_PAGE_DESCRIPTION;

export const ATS_TITLE = ATS_PAGE_TITLE;
export const ATS_DESCRIPTION = ATS_PAGE_DESCRIPTION;

/** `/pricing` keeps its copy until MDI-320 redirects it and removes it from the sitemap. */
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
 * A designed image can replace `public/share-image.png` without code changes.
 */
export const SHARE_IMAGE = {
  url: '/share-image.png',
  width: 1200,
  height: 630,
  alt: `Talvio. ${HERO_TITLE}. ${BENEFITS_TITLE}`,
};

/** Open Graph and Twitter fields shared by every page. A segment that sets `openGraph` replaces the parent's, so pages spread these. */
export const SHARE_OPEN_GRAPH = { siteName: 'Talvio', type: 'website', images: [SHARE_IMAGE] } satisfies Metadata['openGraph'];
export const SHARE_TWITTER = { card: 'summary_large_image', images: [SHARE_IMAGE] } satisfies Metadata['twitter'];

/**
 * Canonical indexable pages. Anonymous `/home` redirects to `/`.
 * Blog URLs belong to MDI-249 and are added when `/blog` exists.
 */
export const INDEXABLE_PUBLIC_PATHS = ['/', '/templates', '/pricing', '/ats-friendly-resume', '/privacy-policy', '/terms'] as const;

export type IndexablePublicPath = (typeof INDEXABLE_PUBLIC_PATHS)[number];

/** Date each page's content last changed, for the sitemap. Update it with the page's copy. */
export const PUBLIC_PAGE_LAST_MODIFIED: Record<IndexablePublicPath, string> = {
  '/': '2026-10-04',
  '/templates': '2026-10-04',
  '/pricing': '2026-10-03',
  '/ats-friendly-resume': '2026-10-04',
  '/privacy-policy': '2026-10-04',
  '/terms': '2026-10-04',
};

export function publicSitemap(): MetadataRoute.Sitemap {
  const origin = siteOrigin();
  return INDEXABLE_PUBLIC_PATHS.map((path) => ({
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
