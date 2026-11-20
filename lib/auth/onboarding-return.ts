import { safeRedirectPath } from './safe-redirect-path';

export const ONBOARDING_HREF = '/account/create';
const RETURN_PARAM = 'next';
const NEW_RESUME_PATH = '/resume';

/**
 * Onboarding for someone who came to start a resume and has no profile yet: `/account/create?next=/resume?template=…`.
 * A resume starts from the profile, so the profile is saved first and the way back to the new resume is kept.
 */
export function onboardingHref(returnTo: string) {
  return `${ONBOARDING_HREF}?${RETURN_PARAM}=${encodeURIComponent(returnTo)}`;
}

/**
 * Where onboarding goes back to after Save profile, read from `next`. Only the new-resume screen sends people to
 * onboarding, so only `/resume` (with its query) is accepted; anything else is no return path.
 */
export function onboardingReturnPath(searchParams: { get: (name: string) => string | null } | null): string | null {
  const path = safeRedirectPath(searchParams?.get(RETURN_PARAM) ?? null, '');
  return path === NEW_RESUME_PATH || path.startsWith(`${NEW_RESUME_PATH}?`) ? path : null;
}

/** Adds the return path to another account URL, so the step after onboarding still knows the way back. */
export function withOnboardingReturn(href: string, returnTo: string | null) {
  if (!returnTo) {
    return href;
  }
  return `${href}${href.includes('?') ? '&' : '?'}${RETURN_PARAM}=${encodeURIComponent(returnTo)}`;
}
