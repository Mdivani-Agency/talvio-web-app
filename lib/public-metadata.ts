import type { Metadata } from 'next';

import { SIGNUP_CREDIT_GRANT } from './credits';
import { allowPublicIndexing, siteOrigin } from './site';

const signupCredits = SIGNUP_CREDIT_GRANT.toLocaleString('en-US');

export const HOME_TITLE = 'Talvio | One profile and a resume PDF';
export const HOME_DESCRIPTION = `Keep one profile, pick a template, and download a resume PDF. New accounts start with ${signupCredits} credits. No card is required.`;

export const TEMPLATES_TITLE = 'Resume templates | Talvio';
export const TEMPLATES_DESCRIPTION = 'Browse resume templates and preview a layout before you download a PDF. Preview is free.';

export const TERMS_TITLE = 'Terms of Service | Talvio';
export const TERMS_DESCRIPTION = 'The terms for using Talvio.';

export const PRIVACY_TITLE = 'Privacy Policy | Talvio';
export const PRIVACY_DESCRIPTION = 'How Talvio handles personal data, and how to ask a question about your account.';

/**
 * Canonical indexable pages. Anonymous `/home` redirects to `/`.
 * Blog URLs belong to MDI-249 and are added when `/blog` exists.
 * `/pricing` and `/ats-friendly-resume` are not shipped.
 */
export const INDEXABLE_PUBLIC_PATHS = ['/', '/templates', '/privacy-policy', '/terms'] as const;

export const PRIVATE_ROBOTS_PREFIXES = ['/account', '/auth', '/resume', '/api'] as const;

export const PRIVATE_ROBOTS: Metadata['robots'] = { index: false, follow: false };

export function publicPageMetadata(path: string, title: string, description: string): Metadata {
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path === '/' ? `${siteOrigin()}/` : path },
    robots: allowPublicIndexing() ? { index: true, follow: true } : PRIVATE_ROBOTS,
    openGraph: {
      title,
      description,
      url: path,
      siteName: 'Talvio',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export const homeMetadata = publicPageMetadata('/', HOME_TITLE, HOME_DESCRIPTION);
