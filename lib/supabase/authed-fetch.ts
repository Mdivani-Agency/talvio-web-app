import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export async function authedFetch(url: string, options: RequestInit = {}) {
  const supabase = createSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (!accessToken) {
    throw new Error('No token found');
  }

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
