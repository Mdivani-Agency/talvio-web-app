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
