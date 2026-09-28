export type PublicEntryRedirect = {
  pathname: '/' | '/account';
  status: 307 | 308;
};

/**
 * Anonymous `/` is the only indexable homepage.
 * Signed-in `/` still opens the account.
 * Anonymous `/home` permanently joins `/`. Signed-in `/home` stays available so the marketing header can sign out.
 */
export function publicEntryRedirect(pathname: string, signedIn: boolean): PublicEntryRedirect | null {
  if ((pathname === '/home' || pathname === '/home/') && !signedIn) {
    return { pathname: '/', status: 308 };
  }

  if (pathname === '/' && signedIn) {
    return { pathname: '/account', status: 307 };
  }

  return null;
}
