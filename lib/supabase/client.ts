import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser Supabase client for auth/session only.
 * Do not call `.from(...)` — table access is GraphQL (`getGraphqlSdk`).
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required',
    );
  }

  return createBrowserClient(url, anonKey);
}
