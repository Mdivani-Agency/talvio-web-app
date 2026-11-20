import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  applyApplicationPatch,
  toApplication,
  toApplicationUpdate,
  type ApplicationPatch,
} from '@/lib/adapters/application.adapter';
import { getGraphqlSdk } from '@/lib/graphql-client';
import type { JobApplication } from '@lib/types';

import { applicationsQueryKey } from './use-applications';

export type UpdateApplicationInput = { id: string; patch: ApplicationPatch };

export async function updateApplication({ id, patch }: UpdateApplicationInput): Promise<JobApplication> {
  const sdk = await getGraphqlSdk();
  const data = await sdk.UpdateApplication({ id, set: toApplicationUpdate(patch), atMost: 1 });
  const row = data.updatejob_applicationsCollection?.records[0];
  if (!data.updatejob_applicationsCollection?.affectedCount || !row) {
    throw new Error('Application not found');
  }
  return toApplication(row);
}

/**
 * Updates a card. The board changes first: the cached list is patched before the request, put back if it fails, and
 * refetched once it settles.
 */
export function useUpdateApplication(userId?: string) {
  const queryClient = useQueryClient();
  const queryKey = applicationsQueryKey(userId);

  return useMutation({
    mutationFn: updateApplication,
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<JobApplication[]>(queryKey);
      if (previous) {
        const now = new Date();
        queryClient.setQueryData<JobApplication[]>(
          queryKey,
          previous.map((application) => (application.id === id ? applyApplicationPatch(application, patch, now) : application)),
        );
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['applications', userId] });
    },
  });
}
