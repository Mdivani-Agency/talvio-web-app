import { describe, expect, it } from 'vitest';

import { publicEntryRedirect, skipsPublicEntryRedirect } from './public-entry';

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
