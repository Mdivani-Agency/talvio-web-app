import { afterEach, describe, expect, it } from 'vitest';

import { SIGNUP_CREDIT_GRANT } from './credits';
import {
  HOME_DESCRIPTION,
  HOME_TITLE,
  INDEXABLE_PUBLIC_PATHS,
  PRICING_DESCRIPTION,
  PRICING_TITLE,
  PRIVACY_DESCRIPTION,
  PRIVACY_TITLE,
  PRIVATE_ROBOTS_PREFIXES,
  publicPageMetadata,
  TEMPLATES_DESCRIPTION,
  TEMPLATES_TITLE,
  TERMS_DESCRIPTION,
  TERMS_TITLE,
} from './public-metadata';
import { allowPublicIndexing, siteOrigin } from './site';

const unsupported = /ATS|application track|job application|career success|GDPR/i;

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
    expect(HOME_TITLE).toMatch(/profile/i);
    expect(HOME_TITLE).toMatch(/PDF/);
    expect(HOME_DESCRIPTION).toContain('template');
    expect(HOME_DESCRIPTION).toContain(`${SIGNUP_CREDIT_GRANT.toLocaleString('en-US')} credits`);
    expect([HOME_TITLE, HOME_DESCRIPTION, TEMPLATES_TITLE, TEMPLATES_DESCRIPTION, PRICING_TITLE, PRICING_DESCRIPTION, TERMS_TITLE, TERMS_DESCRIPTION, PRIVACY_TITLE, PRIVACY_DESCRIPTION].join('\n')).not.toMatch(unsupported);
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
    expect(metadata.twitter).toMatchObject({ card: 'summary', title: HOME_TITLE });
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
