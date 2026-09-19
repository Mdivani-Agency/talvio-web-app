import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toResume, toResumeUpdateSet } from '@/lib/adapters/resume.adapter';
import { getGraphqlSdk } from '@/lib/graphql-client';
import type { AccountDto, Resume } from '@lib/types';

export async function updateResume(
  resumeId: string,
  patch: Partial<Resume> & { resume?: AccountDto },
): Promise<Resume> {
  const sdk = await getGraphqlSdk();
  const data = await sdk.UpdateResume({
    id: resumeId,
    atMost: 1,
    set: toResumeUpdateSet(patch),
  });
  const row = data.updateresumesCollection?.records?.[0];
  if (!row) {
    throw new Error('Failed to update resume');
  }
  return toResume(row);
}

export function useUpdateResume(resumeId?: string, userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: Partial<Resume> & { resume?: AccountDto }) => {
      if (!resumeId) {
        throw new Error('Resume is required');
      }
      return updateResume(resumeId, patch);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['resume', resumeId] });
      await queryClient.invalidateQueries({ queryKey: ['resumes', userId] });
    },
  });
}
