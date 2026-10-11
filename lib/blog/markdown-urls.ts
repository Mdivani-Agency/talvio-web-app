/**
 * URL policy for article Markdown. Article bodies come from the landing-page API, so every link and image URL in
 * them is untrusted. Each function returns a serialized URL that is safe to put in an attribute, or `null`.
 *
 * - Links keep `http`, `https` and `mailto`, plus in-page fragments and `/blog` paths on Talvio. Other root-relative
 *   paths were written for the content origin and resolve against it. Anything else (other schemes, relative paths,
 *   protocol-relative URLs) is dropped and its text kept.
 * - Images load only from the content origin and the Talvio origin. The browser fetches them directly, so the Talvio
 *   server never requests a URL taken from content.
 */

export type BlogMarkdownOrigins = {
  /** Origin the content was written for (the blog API origin). `null` when the API is not configured. */
  contentOrigin: string | null;
  /** Talvio's public origin. */
  siteOrigin: string;
};

export type BlogLink = { href: string; external: boolean };

const LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

function parse(value: string, base?: string): URL | null {
  try {
    return new URL(value, base);
  } catch {
    return null;
  }
}

function isRootRelative(value: string): boolean {
  return value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\');
}

function isBlogPath(value: string): boolean {
  return value === '/blog' || /^\/blog[/?#]/.test(value);
}

export function safeBlogLink(raw: string, origins: BlogMarkdownOrigins): BlogLink | null {
  const value = raw.trim();
  if (value.startsWith('#')) {
    return value.length > 1 ? { href: value, external: false } : null;
  }
  if (isRootRelative(value)) {
    if (isBlogPath(value)) {
      const url = parse(value, origins.siteOrigin);
      return url ? { href: `${url.pathname}${url.search}${url.hash}`, external: false } : null;
    }
    const url = origins.contentOrigin ? parse(value, origins.contentOrigin) : null;
    return url && url.origin === origins.contentOrigin ? { href: url.href, external: true } : null;
  }
  if (!HAS_SCHEME.test(value)) {
    return null;
  }
  const url = parse(value);
  if (!url || !LINK_PROTOCOLS.has(url.protocol)) {
    return null;
  }
  if (url.protocol !== 'mailto:' && url.origin === origins.siteOrigin) {
    return { href: `${url.pathname}${url.search}${url.hash}`, external: false };
  }
  return { href: url.href, external: true };
}

export function safeBlogImageSrc(raw: string, origins: BlogMarkdownOrigins): string | null {
  const value = raw.trim();
  const allowed = [origins.contentOrigin, origins.siteOrigin].filter((origin): origin is string => !!origin);
  let url: URL | null = null;
  if (isRootRelative(value)) {
    url = origins.contentOrigin ? parse(value, origins.contentOrigin) : null;
  } else if (HAS_SCHEME.test(value)) {
    url = parse(value);
  }
  if (!url || (url.protocol !== 'https:' && url.protocol !== 'http:') || !allowed.includes(url.origin)) {
    return null;
  }
  return url.href;
}
