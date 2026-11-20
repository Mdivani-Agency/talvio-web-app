import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getGraphqlSdk } from '@/lib/graphql-client';

export async function deleteApplication(id: string): Promise<{ id: string }> {
  const sdk = await getGraphqlSdk();
  const data = await sdk.DeleteApplication({ id, atMost: 1 });
  if (!data.deleteFromjob_applicationsCollection?.affectedCount) {
    throw new Error('Application not found');
  }
  return { id };
}

export function useDeleteApplication(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteApplication,
    onSuccess: async (_result, id) => {
      queryClient.removeQueries({ queryKey: ['application', id] });
      await queryClient.invalidateQueries({ queryKey: ['applications', userId] });
    },
  });
}
