import { unwrapCollection, useGraphqlQuery } from '@/lib/query/base-query';
import { toResume } from '@/lib/adapters/resume.adapter';
import { getGraphqlSdk } from '@/lib/graphql-client';
import type { Resume } from '@lib/types';

export async function fetchResume(resumeId: string): Promise<Resume> {
  const sdk = await getGraphqlSdk();
  const data = await sdk.ResumeById({ id: resumeId });
  const row = unwrapCollection(data.resumesCollection)[0];
  if (!row) {
    throw new Error('Resume not found');
  }
  return toResume(row);
}

export function useResume(resumeId?: string, enabled = true) {
  return useGraphqlQuery(
    ['resume', resumeId],
    async () => fetchResume(resumeId!),
    { enabled: enabled && !!resumeId },
  );
}
