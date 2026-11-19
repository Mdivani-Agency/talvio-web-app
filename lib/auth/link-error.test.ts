import { describe, expect, it } from 'vitest';

import { linkErrorCode, linkErrorSignInHref } from './link-error';

describe('linkErrorCode', () => {
  it('returns the error code from the URL', () => {
    expect(linkErrorCode({ error: 'auth_callback_failed' })).toBe('auth_callback_failed');
    expect(linkErrorCode({ error: ['access_denied', 'other'] })).toBe('access_denied');
  });

  it('hides a missing, "null" or free-text value', () => {
    expect(linkErrorCode({})).toBeNull();
    expect(linkErrorCode({ error: '' })).toBeNull();
    expect(linkErrorCode({ error: 'null' })).toBeNull();
    expect(linkErrorCode({ error: 'Call 555-0100 to restore your account' })).toBeNull();
    expect(linkErrorCode({ error: 'a'.repeat(65) })).toBeNull();
  });
});

describe('linkErrorSignInHref', () => {
  it('links to plain sign-in without a return path', () => {
    expect(linkErrorSignInHref({ error: 'access_denied' })).toBe('/auth/sign-in');
  });

  it('keeps the callbackURL', () => {
    expect(linkErrorSignInHref({ callbackURL: '/account/documents' })).toBe(
      '/auth/sign-in?callbackURL=%2Faccount%2Fdocuments',
    );
    expect(linkErrorSignInHref({ next: '/resume' })).toBe('/auth/sign-in?callbackURL=%2Fresume');
  });

  it('drops an off-site return path', () => {
    expect(linkErrorSignInHref({ callbackURL: 'https://evil.example' })).not.toContain('evil.example');
  });
});
