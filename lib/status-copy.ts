import { CONTACT_EMAIL } from './legal-copy';

/** Copy for the shared status layout: the 404 page, the error view and the global error page. */

export const SUPPORT_EMAIL = CONTACT_EMAIL;
export const SUPPORT_HELP_PREFIX = 'If it keeps happening, email';

export const HOME_HREF = '/';
export const GO_HOME_LABEL = 'Go to the homepage';

export const NOT_FOUND_CODE = '404';
export const NOT_FOUND_TITLE = "We can't find that page";
export const NOT_FOUND_BODY = 'The link may be old or mistyped, or the page has moved.';
export const NOT_FOUND_TEMPLATES_LABEL = 'See templates';
export const NOT_FOUND_TEMPLATES_HREF = '/templates';
export const NOT_FOUND_LINKS_LABEL = 'Popular pages';
export const NOT_FOUND_LINKS_INTRO = 'Or try:';
export const NOT_FOUND_LINKS = [
  { name: 'Blog', href: '/blog' },
  { name: 'Sign in', href: '/auth/sign-in' },
] as const;

export const ERROR_TITLE = "This page didn't load";
export const ERROR_BODY =
  'Something went wrong on our side or with the connection. Your saved work is safe. Try again in a moment.';
export const ERROR_RETRY_LABEL = 'Try again';

export const GLOBAL_ERROR_TITLE = 'Talvio hit a problem';
export const GLOBAL_ERROR_BODY = 'Reload the page. Your saved work is safe.';
export const GLOBAL_ERROR_RELOAD_LABEL = 'Reload the page';

export const NEW_RESUME_LABEL = 'Start a new resume';
export const NEW_RESUME_HREF = '/resume';

export const RESUME_SIGN_IN_TITLE = 'Sign in to open this resume';
export const RESUME_SIGN_IN_BODY = 'Saved resumes live in your account. Sign in and we bring you straight back here.';
export const RESUME_SIGN_IN_LABEL = 'Sign in';

export const RESUME_NOT_FOUND_TITLE = "We can't find this resume";
export const RESUME_NOT_FOUND_BODY = 'It may have been deleted, or it belongs to another account.';
export const RESUME_NOT_FOUND_DOCUMENTS_LABEL = 'Go to documents';
export const RESUME_NOT_FOUND_DOCUMENTS_HREF = '/account/documents';
