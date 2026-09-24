/** Supabase Auth verify URL for a magic-link query string. */
export function supabaseVerifyUrl(supabaseUrl: string, search: string): string {
  const target = new URL('/auth/v1/verify', supabaseUrl);
  target.search = search;
  return target.toString();
}
