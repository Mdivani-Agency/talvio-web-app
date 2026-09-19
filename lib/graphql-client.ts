import { GraphQLClient, ClientError } from 'graphql-request';

import { getSdk } from '@/lib/graphql/generated';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export type GraphqlSdk = ReturnType<typeof getSdk>;

function graphqlEndpoint() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required',
    );
  }

  return { url: `${url.replace(/\/$/, '')}/graphql/v1`, anonKey };
}

export async function getGraphqlSdk(): Promise<GraphqlSdk> {
  const { url, anonKey } = graphqlEndpoint();
  const supabase = createSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token ?? anonKey;

  const client = new GraphQLClient(url, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
    },
  });

  return getSdk(client);
}

type GraphqlErrorLike = {
  message?: string;
  extensions?: { code?: string };
};

function graphqlErrors(error: unknown): GraphqlErrorLike[] {
  if (error instanceof ClientError) {
    return (error.response.errors ?? []) as GraphqlErrorLike[];
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'errors' in error.response &&
    Array.isArray(error.response.errors)
  ) {
    return error.response.errors as GraphqlErrorLike[];
  }
  return [];
}

function errorText(error: unknown): string {
  const first = graphqlErrors(error)[0];
  if (first?.message) {
    return first.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '';
}

function errorCode(error: unknown): string {
  const first = graphqlErrors(error)[0];
  return first?.extensions?.code ?? '';
}

export function parseGraphqlError(error: unknown): string {
  const code = errorCode(error);
  const message = errorText(error);
  const haystack = `${code} ${message}`.toLowerCase();

  if (haystack.includes('insufficient_credits')) {
    return 'Not enough credits';
  }
  if (haystack.includes('unknown_action')) {
    return 'Unknown billing action';
  }
  if (haystack.includes('resume_not_found')) {
    return 'Resume not found';
  }
  if (haystack.includes('not authenticated') || haystack.includes('invalid_user')) {
    return 'Please sign in';
  }
  if (code === '42501' || haystack.includes('42501') || haystack.includes('permission denied')) {
    return "You don't have permission to do that";
  }
  if (code === '23505' || haystack.includes('23505') || haystack.includes('unique')) {
    return 'That record already exists';
  }

  return message || 'Something went wrong';
}

export function isGraphqlAuthError(error: unknown): boolean {
  const mapped = parseGraphqlError(error);
  return mapped === 'Please sign in' || mapped === "You don't have permission to do that";
}

export function shouldRetryGraphqlQuery(failureCount: number, error: unknown): boolean {
  return !isGraphqlAuthError(error) && failureCount < 2;
}
