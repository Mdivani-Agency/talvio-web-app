import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toApplicationNote, type ApplicationNote } from '@/lib/adapters/application.adapter';
import { getGraphqlSdk } from '@/lib/graphql-client';

import { applicationQueryKey } from './use-application';

export type AddApplicationNoteInput = { applicationId: string; content: string };

export async function addApplicationNote({ applicationId, content }: AddApplicationNoteInput): Promise<ApplicationNote> {
  const sdk = await getGraphqlSdk();
  const data = await sdk.InsertApplicationNote({ objects: [{ application_id: applicationId, content }] });
  const row = data.insertIntojob_application_notesCollection?.records[0];
  if (!row) {
    throw new Error('Note not saved');
  }
  return toApplicationNote(row);
}

export function useAddApplicationNote(applicationId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addApplicationNote,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: applicationQueryKey(applicationId) });
    },
  });
}
