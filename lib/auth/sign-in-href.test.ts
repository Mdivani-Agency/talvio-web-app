import { describe, expect, it } from 'vitest';

import { signInHref, signInSearchParams } from './sign-in-href';

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
