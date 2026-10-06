import { describe, expect, it } from 'vitest';

import { DEFAULT_FEATURE_FLAGS } from './flags';
import { flagRedirect, publicEntryRedirect, skipsPublicEntryRedirect } from './public-entry';

describe('public entry redirects', () => {
  it('sends an anonymous visitor from /home to /', () => {
    expect(publicEntryRedirect('/home', false)).toEqual({ pathname: '/', status: 307 });
    expect(publicEntryRedirect('/home/', false)).toEqual({ pathname: '/', status: 307 });
  });

  it('leaves the marketing page in place for a signed-in visitor', () => {
    expect(publicEntryRedirect('/home', true)).toBeNull();
  });

  it('sends a signed-in visitor from / to the account', () => {
    expect(publicEntryRedirect('/', true)).toEqual({ pathname: '/account', status: 307 });
  });

  it('serves / to an anonymous visitor', () => {
    expect(publicEntryRedirect('/', false)).toBeNull();
    expect(publicEntryRedirect('/templates', false)).toBeNull();
  });

  it('leaves route prefetches on their original URL', () => {
    expect(skipsPublicEntryRedirect((name) => (name === 'next-router-prefetch' ? '1' : null))).toBe(true);
    expect(skipsPublicEntryRedirect((name) => (name === 'next-router-segment-prefetch' ? '1' : null))).toBe(true);
    expect(skipsPublicEntryRedirect(() => null)).toBe(false);
  });
});

describe('flag redirects', () => {
  const on = { plansPage: true, creditPurchaseUi: true };

  it('sends /pricing to the homepage allowance section while the plans page is off', () => {
    expect(flagRedirect('/pricing', DEFAULT_FEATURE_FLAGS)).toEqual({ pathname: '/', hash: 'whats-free', status: 307 });
    expect(flagRedirect('/pricing/', DEFAULT_FEATURE_FLAGS)).toEqual({ pathname: '/', hash: 'whats-free', status: 307 });
  });

  it('sends /account/credits to the account while the purchase UI is off', () => {
    expect(flagRedirect('/account/credits', DEFAULT_FEATURE_FLAGS)).toEqual({ pathname: '/account', status: 307 });
    expect(flagRedirect('/account/upgrade', DEFAULT_FEATURE_FLAGS)).toEqual({ pathname: '/account', status: 307 });
  });

  it('serves both paths again when the flags are on', () => {
    expect(flagRedirect('/pricing', on)).toBeNull();
    expect(flagRedirect('/account/credits', on)).toBeNull();
    expect(flagRedirect('/account/upgrade', on)).toBeNull();
    expect(flagRedirect('/pricing', { ...DEFAULT_FEATURE_FLAGS, plansPage: true })).toBeNull();
    expect(flagRedirect('/account/credits', { ...DEFAULT_FEATURE_FLAGS, creditPurchaseUi: true })).toBeNull();
  });

  it('leaves every other path alone', () => {
    for (const path of ['/', '/templates', '/account', '/pricing-guide', '/account/credits-history']) {
      expect(flagRedirect(path, DEFAULT_FEATURE_FLAGS)).toBeNull();
    }
  });
});
