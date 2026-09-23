import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toResume, toResumeUpdateSet, type ResumeContentPatch } from '@/lib/adapters/resume.adapter';
import { getGraphqlSdk } from '@/lib/graphql-client';
import type { ResumesFilter } from '@/lib/graphql/generated';
import type { Resume } from '@lib/types';

export class ResumeConflictError extends Error {
  constructor() {
    super('This resume changed in another session');
    this.name = 'ResumeConflictError';
  }
}

export function isResumeConflict(error: unknown): boolean {
  return error instanceof ResumeConflictError;
}

export async function updateResume(
  resumeId: string,
  patch: ResumeContentPatch,
  options?: { baseUpdatedAt?: string },
): Promise<Resume> {
  const sdk = await getGraphqlSdk();
  const filter: ResumesFilter = {
    id: { eq: resumeId },
    ...(options?.baseUpdatedAt ? { updated_at: { eq: options.baseUpdatedAt } } : {}),
  };
  const data = await sdk.UpdateResume({
    filter,
    atMost: 1,
    set: toResumeUpdateSet(patch),
  });
  const row = data.updateresumesCollection?.records?.[0];
  if (!row) {
    if (options?.baseUpdatedAt) {
      throw new ResumeConflictError();
    }
    throw new Error('Failed to update resume');
  }
  return toResume(row);
}

export function useUpdateResume(resumeId?: string, userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: ResumeContentPatch) => {
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
