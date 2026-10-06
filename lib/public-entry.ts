import type { FeatureFlags } from './flags';
import { WHATS_FREE_ID } from './homepage-copy';

export type PublicEntryRedirect = {
  pathname: '/' | '/account';
  status: 307;
};

/**
 * Anonymous `/` is the only indexable homepage.
 * Signed-in `/` still opens the account.
 * Anonymous `/home` uses a temporary redirect so a later signed-in visit can still open `/home`.
 */
/** Route prefetches stay on the requested URL. Redirecting a prefetch of `/` stalls WebKit while the account document is loading. */
export function skipsPublicEntryRedirect(header: (name: string) => string | null) {
  return header('next-router-prefetch') === '1' || header('next-router-segment-prefetch') === '1';
}

export function publicEntryRedirect(pathname: string, signedIn: boolean): PublicEntryRedirect | null {
  if ((pathname === '/home' || pathname === '/home/') && !signedIn) {
    return { pathname: '/', status: 307 };
  }

  if (pathname === '/' && signedIn) {
    return { pathname: '/account', status: 307 };
  }

  return null;
}

export type FlagRedirect = {
  pathname: '/' | '/account';
  hash?: string;
  status: 307;
};

/**
 * Entry points a release flag turns off (MDI-398). Temporary redirects, so turning the flag on restores the page.
 * `/pricing` goes to the homepage allowance section. `/account/credits` and `/account/upgrade` have no page and go to the account.
 */
export function flagRedirect(
  pathname: string,
  flags: Pick<FeatureFlags, 'plansPage' | 'creditPurchaseUi'>,
): FlagRedirect | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

  if (path === '/pricing' && !flags.plansPage) {
    return { pathname: '/', hash: WHATS_FREE_ID, status: 307 };
  }

  if ((path === '/account/credits' || path === '/account/upgrade') && !flags.creditPurchaseUi) {
    return { pathname: '/account', status: 307 };
  }

  return null;
}
