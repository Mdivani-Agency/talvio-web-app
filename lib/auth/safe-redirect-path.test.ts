import { describe, expect, it } from 'vitest';

import {
  publicRequestOrigin,
  safeRedirectPath,
  sameOriginRedirect,
} from './safe-redirect-path';

describe('safeRedirectPath', () => {
  it('returns the fallback for missing, off-site, and protocol-relative values', () => {
    expect(safeRedirectPath(null)).toBe('/account');
    expect(safeRedirectPath('')).toBe('/account');
    expect(safeRedirectPath('javascript:alert(1)')).toBe('/account');
    expect(safeRedirectPath('https://evil.com')).toBe('/account');
    expect(safeRedirectPath('//evil.com')).toBe('/account');
    expect(safeRedirectPath('/\\evil.com')).toBe('/account');
    expect(safeRedirectPath('/%5Cevil.com')).toBe('/account');
    expect(safeRedirectPath('/%5C%5Cevil.com')).toBe('/account');
  });

  it('keeps same-origin paths including search and hash', () => {
    expect(safeRedirectPath('/account')).toBe('/account');
    expect(safeRedirectPath('/account/documents?tab=1#files')).toBe(
      '/account/documents?tab=1#files',
    );
  });

  it('accepts a custom fallback', () => {
    expect(safeRedirectPath('//evil.com', '/')).toBe('/');
  });
});

describe('publicRequestOrigin', () => {
  it('prefers x-forwarded-host in production-style proxies', () => {
    const request = new Request('http://127.0.0.1:3002/auth/callback', {
      headers: {
        'x-forwarded-host': 'app.talvio.com',
        'x-forwarded-proto': 'https',
      },
    });

    expect(publicRequestOrigin(request)).toBe('https://app.talvio.com');
  });

  it('falls back to the request URL origin', () => {
    const request = new Request('http://localhost:3002/auth/callback');
    expect(publicRequestOrigin(request)).toBe('http://localhost:3002');
  });
});

describe('sameOriginRedirect', () => {
  it('replaces an off-site target with the account fallback', () => {
    const origin = 'https://app.talvio.com';
    expect(sameOriginRedirect('/\\evil.com', origin).href).toBe(
      'https://app.talvio.com/account',
    );
    expect(sameOriginRedirect('/account/documents', origin).href).toBe(
      'https://app.talvio.com/account/documents',
    );
  });
});
