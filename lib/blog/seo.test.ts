import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { serializeJsonLd } from '@/lib/structured-data';

import type { BlogPost } from './contract';
import {
  blogArticleMetadata,
  blogArticleStructuredData,
  blogCanonical,
  BLOG_MISSING_ARTICLE_METADATA,
  isListedInTalvioSitemap,
} from './seo';

const talvioOnly: BlogPost = {
  slug: 'resume-tips',
  title: 'Résumé tips: "quotes" & <script>alert(1)</script>',
  description: 'A </script><script>alert(2)</script> description.',
  content: 'Body.',
  coverImagePath: '/uploads/cover.png',
  tags: [],
  sites: ['talvio'],
  featured: false,
  publishedAt: '2026-09-20T09:00:00.000Z',
  createdAt: '2026-09-19T09:00:00.000Z',
  updatedAt: '2026-09-25T09:00:00.000Z',
};
const shared: BlogPost = { ...talvioOnly, slug: 'shared-post', sites: ['agency', 'talvio'] };
const sharedForTalvio: BlogPost = { ...shared, slug: 'shared-for-talvio', tags: ['Talvio'] };
const cover = 'https://content.example.test/uploads/cover.png';

const env = { site: process.env.SITE_URL, vercel: process.env.VERCEL_ENV };
beforeEach(() => {
  delete process.env.SITE_URL;
  delete process.env.VERCEL_ENV;
});
afterEach(() => {
  for (const [key, value] of [['SITE_URL', env.site], ['VERCEL_ENV', env.vercel]] as const) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

describe('blogCanonical', () => {
  it('self-canonicalises Talvio-only posts and shared posts tagged for Talvio', () => {
    expect(blogCanonical(talvioOnly)).toEqual({ url: 'https://www.talvio.co/blog/resume-tips', primary: 'talvio' });
    expect(blogCanonical(sharedForTalvio)).toEqual({ url: 'https://www.talvio.co/blog/shared-for-talvio', primary: 'talvio' });
    expect(isListedInTalvioSitemap(talvioOnly)).toBe(true);
  });

  it('points a post both sites show at the agency copy and keeps it out of the Talvio sitemap', () => {
    expect(blogCanonical(shared)).toEqual({ url: 'https://mdivani.agency/blog/shared-post', primary: 'agency' });
    expect(isListedInTalvioSitemap(shared)).toBe(false);
  });

  it('uses the production origin on previews and never indexes them', () => {
    process.env.VERCEL_ENV = 'preview';
    const metadata = blogArticleMetadata(talvioOnly, cover);
    expect(metadata.alternates?.canonical).toBe('https://www.talvio.co/blog/resume-tips');
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});

describe('blogArticleMetadata', () => {
  it('describes the article with one absolute canonical and article social fields', () => {
    const metadata = blogArticleMetadata(talvioOnly, cover);
    expect(metadata.title).toEqual({ absolute: `${talvioOnly.title} | Talvio` });
    expect(metadata.description).toBe(talvioOnly.description);
    expect(metadata.alternates).toEqual({ canonical: 'https://www.talvio.co/blog/resume-tips' });
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.openGraph).toMatchObject({
      type: 'article',
      url: 'https://www.talvio.co/blog/resume-tips',
      siteName: 'Talvio',
      images: [{ url: cover, alt: '' }],
      publishedTime: talvioOnly.publishedAt,
      modifiedTime: talvioOnly.updatedAt,
    });
    expect(metadata.twitter).toMatchObject({ card: 'summary_large_image', images: [{ url: cover, alt: '' }] });
  });

  it('falls back to the shared image when the post has no cover', () => {
    const metadata = blogArticleMetadata({ ...talvioOnly, coverImagePath: null }, null);
    expect(metadata.openGraph).toMatchObject({ images: [{ url: '/share-image-v1.png', width: 1200, height: 630 }] });
  });

  it('gives a shared post the agency canonical in both the link and Open Graph', () => {
    const metadata = blogArticleMetadata(shared, cover);
    expect(metadata.alternates?.canonical).toBe('https://mdivani.agency/blog/shared-post');
    expect(metadata.openGraph).toMatchObject({ url: 'https://mdivani.agency/blog/shared-post' });
  });

  it('describes nothing for a slug that is not served', () => {
    expect(BLOG_MISSING_ARTICLE_METADATA).toEqual({
      alternates: { canonical: null },
      robots: { index: false, follow: false },
      openGraph: null,
      twitter: null,
    });
  });
});

describe('blogArticleStructuredData', () => {
  it('builds a BlogPosting and BreadcrumbList from visible data, with Talvio as publisher and no author', () => {
    const [posting, breadcrumbs] = blogArticleStructuredData(talvioOnly, cover)['@graph'];
    expect(posting).toEqual({
      '@type': 'BlogPosting',
      '@id': 'https://www.talvio.co/blog/resume-tips#article',
      headline: talvioOnly.title,
      description: talvioOnly.description,
      url: 'https://www.talvio.co/blog/resume-tips',
      mainEntityOfPage: 'https://www.talvio.co/blog/resume-tips',
      datePublished: talvioOnly.publishedAt,
      dateModified: talvioOnly.updatedAt,
      inLanguage: 'en',
      image: [cover],
      publisher: { '@type': 'Organization', '@id': 'https://www.talvio.co/#organization', name: 'Talvio', url: 'https://www.talvio.co/' },
    });
    expect(posting).not.toHaveProperty('author');
    expect(breadcrumbs).toEqual({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.talvio.co/' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.talvio.co/blog' },
        { '@type': 'ListItem', position: 3, name: talvioOnly.title, item: 'https://www.talvio.co/blog/resume-tips' },
      ],
    });
  });

  it('omits the image without a cover and the publisher on an agency-primary post', () => {
    const [posting, breadcrumbs] = blogArticleStructuredData(shared, null)['@graph'];
    expect(posting).not.toHaveProperty('image');
    expect(posting).not.toHaveProperty('publisher');
    expect(posting).toMatchObject({ url: 'https://mdivani.agency/blog/shared-post' });
    expect(breadcrumbs.itemListElement[2].item).toBe('https://www.talvio.co/blog/shared-post');
  });

  it('serialises hostile titles without closing the script tag', () => {
    const json = serializeJsonLd(blogArticleStructuredData(talvioOnly, cover));
    expect(json).not.toMatch(/<\/?script/i);
    expect(JSON.parse(json)['@graph'][0].headline).toBe(talvioOnly.title);
  });
});
