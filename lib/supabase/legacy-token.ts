const LEGACY_BEARER_COOKIE = 'bearer_token=; path=/; max-age=0; sameSite=strict';

export function clearLegacyBearerToken() {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem('bearer_token');
  document.cookie = LEGACY_BEARER_COOKIE;
}
