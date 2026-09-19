import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toResume, toResumeInsertInput } from '@/lib/adapters/resume.adapter';
import { getGraphqlSdk } from '@/lib/graphql-client';
import type { PreviewDto, Resume } from '@lib/types';

export async function createResume({
  userId,
  type = 'GENERAL',
  body,
  sourceResumeId,
}: {
  userId: string;
  type?: 'GENERAL' | 'JOB_SPECIFIC';
  body: PreviewDto;
  sourceResumeId?: string | null;
}): Promise<Resume> {
  const sdk = await getGraphqlSdk();
  const data = await sdk.InsertResume({
    objects: [toResumeInsertInput({ userId, type, body, sourceResumeId })],
  });
  const row = data.insertIntoresumesCollection?.records?.[0];
  if (!row) {
    throw new Error('Failed to create resume');
  }
  return toResume(row);
}

export function useCreateResume(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { type?: 'GENERAL' | 'JOB_SPECIFIC'; body: PreviewDto }) => {
      if (!userId) {
        throw new Error('Sign in to create a resume');
      }
      return createResume({ userId, ...input });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['resumes', userId] });
    },
  });
}
