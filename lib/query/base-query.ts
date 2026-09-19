'use client';

import {
  useQuery,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';

import { getGraphqlSdk, shouldRetryGraphqlQuery, type GraphqlSdk } from '@/lib/graphql-client';

export type Collection<T> = {
  edges?: Array<{ node?: T | null } | null> | null;
} | null;

export function unwrapCollection<T>(collection: Collection<T> | undefined): T[] {
  return (collection?.edges ?? [])
    .map((edge) => edge?.node)
    .filter((node): node is T => node != null);
}

type GraphqlQueryOptions<T> = Omit<
  UseQueryOptions<T, Error, T, QueryKey>,
  'queryKey' | 'queryFn'
>;

export function useGraphqlQuery<T>(
  queryKey: QueryKey,
  queryFn: (sdk: GraphqlSdk) => Promise<T>,
  options?: GraphqlQueryOptions<T>,
): UseQueryResult<T, Error> {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const sdk = await getGraphqlSdk();
      return queryFn(sdk);
    },
    retry: shouldRetryGraphqlQuery,
    ...options,
  });
}
