import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toApplicationNote, type ApplicationNote } from '@/lib/adapters/application.adapter';
import { getGraphqlSdk } from '@/lib/graphql-client';

import { applicationQueryKey } from './use-application';

export type UpdateApplicationNoteInput = { id: string; content: string };

export async function updateApplicationNote({ id, content }: UpdateApplicationNoteInput): Promise<ApplicationNote> {
  const sdk = await getGraphqlSdk();
  const data = await sdk.UpdateApplicationNote({ id, content, atMost: 1 });
  const row = data.updatejob_application_notesCollection?.records[0];
  if (!data.updatejob_application_notesCollection?.affectedCount || !row) {
    throw new Error('Note not found');
  }
  return toApplicationNote(row);
}

export function useUpdateApplicationNote(applicationId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateApplicationNote,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: applicationQueryKey(applicationId) });
    },
  });
}
