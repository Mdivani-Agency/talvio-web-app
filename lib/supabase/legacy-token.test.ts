/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from 'vitest';

import { clearLegacyBearerToken } from './legacy-token';

describe('clearLegacyBearerToken', () => {
  afterEach(() => {
    window.localStorage.clear();
    document.cookie = 'bearer_token=; path=/; max-age=0';
  });

  it('removes the legacy localStorage token', () => {
    window.localStorage.setItem('bearer_token', 'stale');
    clearLegacyBearerToken();
    expect(window.localStorage.getItem('bearer_token')).toBeNull();
  });
});
