import { GraphQLClient } from 'graphql-request';

import { getSdk } from '@/lib/graphql/generated';

export function getServerGraphqlSdk(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !anonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required',
    );
  }
  if (!accessToken) {
    throw new Error('Please sign in');
  }

  return getSdk(
    new GraphQLClient(`${url.replace(/\/$/, '')}/graphql/v1`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
    }),
  );
}
