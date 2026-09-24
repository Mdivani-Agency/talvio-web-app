import { describe, expect, it } from 'vitest';

import { accountSignInRedirect, signInHref, signInSearchParams } from './sign-in-href';

describe('signInSearchParams', () => {
  it('prefers callbackURL, then callbackUrl, then next', () => {
    expect(signInSearchParams(new URLSearchParams('callbackURL=/resume&next=/account'))).toBe('/resume');
    expect(signInSearchParams(new URLSearchParams('callbackUrl=/resume?template=mid-level-ember'))).toBe(
      '/resume?template=mid-level-ember',
    );
    expect(signInSearchParams(new URLSearchParams('next=/account/documents'))).toBe('/account/documents');
    expect(signInSearchParams(new URLSearchParams())).toBeNull();
  });
});

describe('signInHref', () => {
  it('writes a safe local callbackURL', () => {
    expect(signInHref('/resume?template=mid-level-ember')).toBe(
      '/auth/sign-in?callbackURL=%2Fresume%3Ftemplate%3Dmid-level-ember',
    );
    expect(signInHref('https://evil.com')).toBe('/auth/sign-in?callbackURL=%2Faccount');
  });
});

describe('accountSignInRedirect', () => {
  it('keeps an account subpath and drops anything outside /account', () => {
    expect(accountSignInRedirect('/account/documents')).toBe(
      '/auth/sign-in?callbackURL=%2Faccount%2Fdocuments',
    );
    expect(accountSignInRedirect('/account/documents?tab=1')).toBe(
      '/auth/sign-in?callbackURL=%2Faccount%2Fdocuments%3Ftab%3D1',
    );
    expect(accountSignInRedirect('/resume?template=mid-level-ember')).toBe(
      '/auth/sign-in?callbackURL=%2Faccount',
    );
    expect(accountSignInRedirect(null)).toBe('/auth/sign-in?callbackURL=%2Faccount');
  });
});
