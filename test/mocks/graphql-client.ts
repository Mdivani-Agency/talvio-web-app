import type { GraphqlSdk } from '@/lib/graphql-client';

export const mockGraphqlSdk = {} as GraphqlSdk;

export async function getGraphqlSdk(): Promise<GraphqlSdk> {
  return mockGraphqlSdk;
}

export function parseGraphqlError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong';
}
