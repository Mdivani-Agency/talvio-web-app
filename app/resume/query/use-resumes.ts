import { unwrapCollection, useGraphqlQuery } from '@/lib/query/base-query';
import { RESUME_PAGE_SIZE, toResume } from '@/lib/adapters/resume.adapter';
import { getGraphqlSdk } from '@/lib/graphql-client';
import type { Resume } from '@lib/types';

export async function fetchResumes(
  userId: string,
  type: 'GENERAL' | 'JOB_SPECIFIC' = 'GENERAL',
  first = RESUME_PAGE_SIZE,
  after?: string,
): Promise<{ resumes: Resume[]; hasNextPage: boolean; endCursor?: string | null }> {
  const sdk = await getGraphqlSdk();
  const data = await sdk.ResumesByUser({
    userId,
    type: type === 'JOB_SPECIFIC' ? 'job_specific' : 'general',
    first,
    after,
  });

  return {
    resumes: unwrapCollection(data.resumesCollection).map(toResume),
    hasNextPage: data.resumesCollection?.pageInfo.hasNextPage ?? false,
    endCursor: data.resumesCollection?.pageInfo.endCursor,
  };
}

export function useResumes(userId?: string, type: 'GENERAL' | 'JOB_SPECIFIC' = 'GENERAL') {
  return useGraphqlQuery(
    ['resumes', userId, type],
    async () => {
      if (!userId) {
        return { resumes: [], hasNextPage: false, endCursor: null };
      }
      return fetchResumes(userId, type);
    },
    { enabled: !!userId },
  );
}
