import { signInHref, signInSearchParams } from './sign-in-href';

type SearchParamValue = string | string[] | undefined;
export type LinkErrorSearchParams = Record<string, SearchParamValue>;

const ERROR_CODE_PATTERN = /^[a-z0-9_.-]{1,64}$/i;

function first(value: SearchParamValue): string | null {
  return (Array.isArray(value) ? value[0] : value) ?? null;
}

/**
 * The `error` code to show under the actions, or null.
 * Missing, "null" and anything that is not a short machine code (free text someone put in the URL) is hidden.
 */
export function linkErrorCode(params: LinkErrorSearchParams): string | null {
  const code = first(params.error)?.trim();
  if (!code || code === 'null' || !ERROR_CODE_PATTERN.test(code)) return null;
  return code;
}

/** Back to sign in, keeping the page the user was heading to when the error URL carries one. */
export function linkErrorSignInHref(params: LinkErrorSearchParams): string {
  const search = new URLSearchParams();
  for (const key of ['callbackURL', 'callbackUrl', 'next']) {
    const value = first(params[key]);
    if (value) search.set(key, value);
  }
  const path = signInSearchParams(search);
  return path ? signInHref(path) : '/auth/sign-in';
}
