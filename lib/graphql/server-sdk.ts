import { GraphQLClient } from 'graphql-request';

import { getSdk } from '@/lib/graphql/generated';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function getServerGraphqlSdk() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !anonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required',
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return getSdk(
    new GraphQLClient(`${url.replace(/\/$/, '')}/graphql/v1`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${session?.access_token ?? anonKey}`,
      },
    }),
  );
}
