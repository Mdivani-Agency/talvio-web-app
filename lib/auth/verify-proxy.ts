/** Supabase Auth verify URL the browser is redirected to. */
export function supabaseVerifyUrl(supabaseUrl: string, search: string): string {
  const target = new URL('/auth/v1/verify', supabaseUrl);
  target.search = search;
  return target.toString();
}
