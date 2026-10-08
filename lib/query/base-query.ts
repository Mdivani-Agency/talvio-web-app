'use client';

import {
  useQuery,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';

import { getGraphqlSdk, shouldRetryGraphqlQuery, type GraphqlSdk } from '@/lib/graphql-client';

export { unwrapCollection, type Collection } from './collection';

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
