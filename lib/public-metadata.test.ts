import { afterEach, describe, expect, it } from 'vitest';

import {
  ATS_DESCRIPTION,
  ATS_TITLE,
  HOME_DESCRIPTION,
  HOME_TITLE,
  INDEXABLE_PUBLIC_PATHS,
  PRICING_DESCRIPTION,
  PRICING_TITLE,
  PRIVACY_DESCRIPTION,
  PRIVACY_TITLE,
  PRIVATE_ROBOTS_PREFIXES,
  PUBLIC_PAGE_LAST_MODIFIED,
  publicPageMetadata,
  publicSitemap,
  SHARE_IMAGE,
  TEMPLATES_DESCRIPTION,
  TEMPLATES_TITLE,
  TERMS_DESCRIPTION,
  TERMS_TITLE,
} from './public-metadata';
import { allowPublicIndexing, siteOrigin } from './site';

describe('public metadata', () => {
  const previousSite = process.env.SITE_URL;
  const previousVercel = process.env.VERCEL_ENV;

  afterEach(() => {
    if (previousSite === undefined) {
      delete process.env.SITE_URL;
    } else {
      process.env.SITE_URL = previousSite;
    }
    if (previousVercel === undefined) {
      delete process.env.VERCEL_ENV;
    } else {
      process.env.VERCEL_ENV = previousVercel;
    }
  });

  it('describes shipped homepage behavior', () => {
    expect(HOME_TITLE).toBe('Free PDF resume generator | Talvio Beta');
    expect(HOME_DESCRIPTION).toContain('3 new resume PDFs every month, free forever');
  });

  /** `/pricing` is left out: MDI-320 redirects it and removes it from the sitemap. */
  const pages = [
    { path: '/', title: HOME_TITLE, description: HOME_DESCRIPTION, query: /free PDF resume generator/i },
    { path: '/templates', title: TEMPLATES_TITLE, description: TEMPLATES_DESCRIPTION, query: /free resume templates/i },
    { path: '/ats-friendly-resume', title: ATS_TITLE, description: ATS_DESCRIPTION, query: /ATS-friendly resume/i },
    { path: '/terms', title: TERMS_TITLE, description: TERMS_DESCRIPTION, query: null },
    { path: '/privacy-policy', title: PRIVACY_TITLE, description: PRIVACY_DESCRIPTION, query: null },
  ];

  it.each(pages)('keeps $path within the title and description limits', ({ title, description, query }) => {
    expect(title.length).toBeLessThanOrEqual(60);
    expect(description.length).toBeGreaterThanOrEqual(120);
    expect(description.length).toBeLessThanOrEqual(155);
    if (query) {
      expect(title).toMatch(query);
    }
  });

  it('covers every indexable page except /pricing and uses no banned or unsupported terms', () => {
    expect(pages.map((page) => page.path).sort()).toEqual(INDEXABLE_PUBLIC_PATHS.filter((path) => path !== '/pricing').sort());
    const text = pages.flatMap((page) => [page.title, page.description]).join('\n');
    expect(text).not.toMatch(/credit|\bpacks?\b|subscription|pricing|\bplans?\b|upgrade|premium|catalogue|\bCV\b|!/i);
    expect(text).not.toMatch(/ATS-proof|ATS-optimized|guarantee|interview|hired|application track|career success|GDPR/i);
    expect(PRICING_TITLE).toBeTruthy();
    expect(PRICING_DESCRIPTION).toBeTruthy();
  });

  it('shares a 1200x630 large image card on every public page', () => {
    expect(SHARE_IMAGE).toMatchObject({ url: '/share-image-v1.png', width: 1200, height: 630 });
    expect(SHARE_IMAGE.alt).toContain('Free PDF resume generator');
    for (const page of pages) {
      const metadata = publicPageMetadata(page.path, page.title, page.description);
      expect(metadata.openGraph).toMatchObject({ title: page.title, description: page.description, images: [SHARE_IMAGE] });
      expect(metadata.twitter).toMatchObject({ card: 'summary_large_image', title: page.title, images: [SHARE_IMAGE] });
    }
  });

  it('gives every sitemap entry a lastModified date', () => {
    delete process.env.SITE_URL;
    const sitemap = publicSitemap();
    expect(sitemap.map((entry) => entry.url)).toEqual(
      INDEXABLE_PUBLIC_PATHS.map((path) => (path === '/' ? 'https://www.talvio.co' : `https://www.talvio.co${path}`)),
    );
    for (const entry of sitemap) {
      expect(entry.lastModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(String(entry.lastModified)))).toBe(false);
    }
    expect(Object.keys(PUBLIC_PAGE_LAST_MODIFIED).sort()).toEqual([...INDEXABLE_PUBLIC_PATHS].sort());
  });

  it('lists only canonical public pages', () => {
    expect(INDEXABLE_PUBLIC_PATHS).toEqual(['/', '/templates', '/pricing', '/ats-friendly-resume', '/privacy-policy', '/terms']);
    expect(INDEXABLE_PUBLIC_PATHS.join(' ')).not.toMatch(/\/home|\/blog|\/account|\/auth|\/resume/);
    expect(PRIVATE_ROBOTS_PREFIXES).toEqual(['/account', '/auth', '/resume', '/api']);
  });

  it('canonicalizes the homepage at the configured origin', () => {
    process.env.SITE_URL = 'https://talvio.co/ignored';
    expect(siteOrigin()).toBe('https://talvio.co');
    const metadata = publicPageMetadata('/', HOME_TITLE, HOME_DESCRIPTION);
    expect(metadata.alternates).toEqual({ canonical: 'https://talvio.co/' });
    delete process.env.SITE_URL;
    expect(siteOrigin()).toBe('https://www.talvio.co');
    expect(metadata.openGraph).toMatchObject({ url: '/', siteName: 'Talvio', type: 'website' });
    expect(metadata.twitter).toMatchObject({ card: 'summary_large_image', title: HOME_TITLE });
  });

  it('keeps preview deployments out of the index', () => {
    delete process.env.VERCEL_ENV;
    expect(allowPublicIndexing()).toBe(true);
    process.env.VERCEL_ENV = 'preview';
    expect(allowPublicIndexing()).toBe(false);
    expect(publicPageMetadata('/', HOME_TITLE, HOME_DESCRIPTION).robots).toEqual({ index: false, follow: false });
    process.env.VERCEL_ENV = 'production';
    expect(allowPublicIndexing()).toBe(true);
  });
});
