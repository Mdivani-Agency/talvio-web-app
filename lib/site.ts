/**
 * Canonical production origin. The apex host redirects to www, so public URLs use www.
 * Preview hosts must not become the public canonical URL.
 */
export const DEFAULT_SITE_ORIGIN = 'https://www.talvio.co';

export function siteOrigin(): string {
  const raw = process.env.SITE_URL?.trim();
  if (!raw) {
    return DEFAULT_SITE_ORIGIN;
  }

  const url = new URL(raw);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('SITE_URL must be an http(s) origin');
  }

  return url.origin;
}

/** Vercel preview deployments stay out of the index. Local and production builds do not. */
export function allowPublicIndexing(): boolean {
  return process.env.VERCEL_ENV !== 'preview';
}
