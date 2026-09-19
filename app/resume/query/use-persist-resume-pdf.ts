import { toResume, toResumePdfPointerSet } from '@/lib/adapters/resume.adapter';
import { getGraphqlSdk } from '@/lib/graphql-client';
import type { Resume } from '@lib/types';

export async function persistResumePdf(
  resumeId: string,
  media: { url: string; key: string },
): Promise<Resume> {
  const sdk = await getGraphqlSdk();
  const data = await sdk.UpdateResume({
    id: resumeId,
    atMost: 1,
    set: toResumePdfPointerSet(media.url, media.key),
  });
  const row = data.updateresumesCollection?.records?.[0];
  if (!row) {
    throw new Error('Failed to save resume PDF');
  }
  return toResume(row);
}
