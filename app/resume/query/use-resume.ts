import { unwrapCollection, useGraphqlQuery } from '@/lib/query/base-query';
import { isGeneratedResume, isOpenDraft, toResume } from '@/lib/adapters/resume.adapter';
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

export async function fetchDraftBySource(sourceResumeId: string): Promise<Resume | undefined> {
  const sdk = await getGraphqlSdk();
  const data = await sdk.ResumesBySource({ sourceId: sourceResumeId, first: 10 });
  return unwrapCollection(data.resumesCollection).map(toResume).find(isOpenDraft);
}

export async function fetchResumeFamily(resumeId: string): Promise<{
  original?: Resume;
  draft?: Resume;
}> {
  const opened = await fetchResume(resumeId);

  if (isOpenDraft(opened) && opened.sourceResumeId) {
    return {
      original: await fetchResume(opened.sourceResumeId),
      draft: opened,
    };
  }

  if (isGeneratedResume(opened)) {
    return {
      original: opened,
      draft: await fetchDraftBySource(opened.id),
    };
  }

  return { draft: opened };
}

export function useResume(resumeId?: string, enabled = true) {
  return useGraphqlQuery(
    ['resume', resumeId],
    async () => fetchResume(resumeId!),
    { enabled: enabled && !!resumeId },
  );
}
