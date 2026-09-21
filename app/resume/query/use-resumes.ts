import { unwrapCollection, useGraphqlQuery } from '@/lib/query/base-query';
import { isOpenDraft, RESUME_PAGE_SIZE, toResume } from '@/lib/adapters/resume.adapter';
import { getGraphqlSdk } from '@/lib/graphql-client';
import type { Resume } from '@lib/types';

import { fetchResume } from './use-resume';

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

  const resumes = unwrapCollection(data.resumesCollection).map(toResume);
  const knownIds = new Set(resumes.map((resume) => resume.id));
  const missingParentIds = resumes
    .filter(isOpenDraft)
    .map((draft) => draft.sourceResumeId)
    .filter((id): id is string => typeof id === 'string' && id.length > 0 && !knownIds.has(id));

  if (missingParentIds.length > 0) {
    const parents = await Promise.all(missingParentIds.map((id) => fetchResume(id)));
    resumes.push(...parents);
  }

  return {
    resumes,
    hasNextPage: data.resumesCollection?.pageInfo.hasNextPage ?? false,
    endCursor: data.resumesCollection?.pageInfo.endCursor,
  };
}

export function useResumes(
  userId?: string,
  type: 'GENERAL' | 'JOB_SPECIFIC' = 'GENERAL',
  first = RESUME_PAGE_SIZE,
) {
  return useGraphqlQuery(
    ['resumes', userId, type, first],
    async () => {
      if (!userId) {
        return { resumes: [], hasNextPage: false, endCursor: null };
      }
      return fetchResumes(userId, type, first);
    },
    { enabled: !!userId },
  );
}
