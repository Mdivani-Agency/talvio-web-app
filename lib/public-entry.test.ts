import { describe, expect, it } from 'vitest';

import { publicEntryRedirect } from './public-entry';

describe('public entry redirects', () => {
  it('sends an anonymous visitor from /home to /', () => {
    expect(publicEntryRedirect('/home', false)).toEqual({ pathname: '/', status: 308 });
    expect(publicEntryRedirect('/home/', false)).toEqual({ pathname: '/', status: 308 });
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
});
