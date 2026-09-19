import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getGraphqlSdk } from '@/lib/graphql-client';

export async function deleteResume(resumeId: string): Promise<{ id: string }> {
  const sdk = await getGraphqlSdk();
  await sdk.DeleteResume({ id: resumeId, atMost: 1 });
  return { id: resumeId };
}

export function useDeleteResume(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteResume,
    onSuccess: async (_result, resumeId) => {
      await queryClient.invalidateQueries({ queryKey: ['resumes', userId] });
      await queryClient.removeQueries({ queryKey: ['resume', resumeId] });
    },
  });
}
