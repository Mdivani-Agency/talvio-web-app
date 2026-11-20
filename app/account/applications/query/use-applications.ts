import { APPLICATION_PAGE_SIZE, toApplication } from '@/lib/adapters/application.adapter';
import { getGraphqlSdk } from '@/lib/graphql-client';
import { unwrapCollection, useGraphqlQuery } from '@/lib/query/base-query';
import type { JobApplication } from '@lib/types';

/** Stops a runaway loop: 50 pages of 100 is far beyond any real board. */
const MAX_PAGES = 50;

export function applicationsQueryKey(userId?: string) {
  return ['applications', userId, APPLICATION_PAGE_SIZE] as const;
}

/** One page of the user's cards, in board order. */
export async function fetchApplications(
  userId: string,
  first = APPLICATION_PAGE_SIZE,
  after?: string,
): Promise<{ applications: JobApplication[]; hasNextPage: boolean; endCursor: string | null }> {
  const sdk = await getGraphqlSdk();
  const data = await sdk.ApplicationsByUser({ userId, first, after });
  return {
    applications: unwrapCollection(data.job_applicationsCollection).map(toApplication),
    hasNextPage: data.job_applicationsCollection?.pageInfo.hasNextPage ?? false,
    endCursor: data.job_applicationsCollection?.pageInfo.endCursor ?? null,
  };
}

/** Every card: the board filters and counts on the client, so it loads pages while `hasNextPage`. */
export async function fetchAllApplications(userId: string): Promise<JobApplication[]> {
  const all: JobApplication[] = [];
  let after: string | undefined;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const { applications, hasNextPage, endCursor } = await fetchApplications(userId, APPLICATION_PAGE_SIZE, after);
    all.push(...applications);
    if (!hasNextPage || !endCursor) {
      break;
    }
    after = endCursor;
  }
  return all;
}

export function useApplications(userId?: string) {
  return useGraphqlQuery(applicationsQueryKey(userId), async () => (userId ? fetchAllApplications(userId) : []), {
    enabled: !!userId,
  });
}
