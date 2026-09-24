import { safeRedirectPath } from './safe-redirect-path';

export function signInSearchParams(searchParams: URLSearchParams) {
  return (
    searchParams.get('callbackURL')
    ?? searchParams.get('callbackUrl')
    ?? searchParams.get('next')
  );
}

export function signInHref(path: string) {
  return `/auth/sign-in?callbackURL=${encodeURIComponent(safeRedirectPath(path))}`;
}

export const ACCOUNT_RETURN_HEADER = 'x-talvio-pathname';

export function accountReturnPath(headerValue: string | null) {
  const path = safeRedirectPath(headerValue, '/account');
  return path.startsWith('/account') ? path : '/account';
}

export function accountSignInRedirect(headerValue: string | null) {
  return signInHref(accountReturnPath(headerValue));
}
