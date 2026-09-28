export type PublicEntryRedirect = {
  pathname: '/' | '/account';
  status: 307 | 308;
};

/**
 * Anonymous `/` is the only indexable homepage.
 * Signed-in `/` still opens the account.
 * Anonymous `/home` permanently joins `/`. Signed-in `/home` stays available so the marketing header can sign out.
 */
/** Route prefetches stay on the requested URL. Redirecting a prefetch of `/` stalls WebKit while the account document is loading. */
export function skipsPublicEntryRedirect(header: (name: string) => string | null) {
  return header('next-router-prefetch') === '1' || header('next-router-segment-prefetch') === '1';
}

export function publicEntryRedirect(pathname: string, signedIn: boolean): PublicEntryRedirect | null {
  if ((pathname === '/home' || pathname === '/home/') && !signedIn) {
    return { pathname: '/', status: 308 };
  }

  if (pathname === '/' && signedIn) {
    return { pathname: '/account', status: 307 };
  }

  return null;
}
