import { useMutation, useQueryClient } from '@tanstack/react-query';

import { isGeneratedResume, toResume, toResumeInsertInput } from '@/lib/adapters/resume.adapter';
import { getGraphqlSdk, parseGraphqlError } from '@/lib/graphql-client';
import type { PreviewDto, Resume } from '@lib/types';

import { fetchResumeByClientDraft } from './use-resume';
import { updateResume } from './use-update-resume';

export async function createResume({
  userId,
  type = 'GENERAL',
  body,
  sourceResumeId,
  clientDraftId,
}: {
  userId: string;
  type?: 'GENERAL' | 'JOB_SPECIFIC';
  body: PreviewDto;
  sourceResumeId?: string | null;
  clientDraftId?: string | null;
}): Promise<Resume> {
  const sdk = await getGraphqlSdk();
  try {
    const data = await sdk.InsertResume({
      objects: [toResumeInsertInput({ userId, type, body, sourceResumeId, clientDraftId })],
    });
    const row = data.insertIntoresumesCollection?.records?.[0];
    if (!row) {
      throw new Error('Failed to create resume');
    }
    return toResume(row);
  } catch (error) {
    if (!clientDraftId || parseGraphqlError(error) !== 'That record already exists') {
      throw error;
    }
    const existing = await fetchResumeByClientDraft(userId, clientDraftId);
    if (!existing) {
      throw error;
    }
    if (isGeneratedResume(existing)) {
      return existing;
    }
    return updateResume(existing.id, {
      name: body.name,
      label: body.label,
      template: body.template,
      color: body.color,
      fontSize: body.fontSize,
      fontFamily: body.fontFamily,
      resume: body.resume,
    }, { baseUpdatedAt: existing.updatedAt });
  }
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
