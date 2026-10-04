import { SITE_ONE_LINER } from './public-claims';
import { SOCIAL_LINKS } from './public-nav';
import { siteOrigin } from './site';

/** schema.org graph for the homepage: the organization, the website and the web application. */
export function homeStructuredData() {
  const origin = siteOrigin();
  const url = `${origin}/`;
  const organization = { '@id': `${origin}/#organization` };

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        ...organization,
        name: 'Talvio',
        url,
        sameAs: SOCIAL_LINKS.map((link) => link.href),
      },
      {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        name: 'Talvio',
        url,
        description: SITE_ONE_LINER,
        inLanguage: 'en',
        publisher: organization,
      },
      {
        '@type': 'WebApplication',
        '@id': `${origin}/#app`,
        name: 'Talvio',
        url,
        description: SITE_ONE_LINER,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires a modern web browser.',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        publisher: organization,
      },
    ],
  };
}

/** JSON for a `<script type="application/ld+json">`, with `<` escaped so the payload cannot close the tag. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
