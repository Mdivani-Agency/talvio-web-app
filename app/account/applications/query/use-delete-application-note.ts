import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getGraphqlSdk } from '@/lib/graphql-client';

import { applicationQueryKey } from './use-application';

export async function deleteApplicationNote(id: string): Promise<{ id: string }> {
  const sdk = await getGraphqlSdk();
  const data = await sdk.DeleteApplicationNote({ id, atMost: 1 });
  if (!data.deleteFromjob_application_notesCollection?.affectedCount) {
    throw new Error('Note not found');
  }
  return { id };
}

export function useDeleteApplicationNote(applicationId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteApplicationNote,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: applicationQueryKey(applicationId) });
    },
  });
}
