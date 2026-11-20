import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getGraphqlSdk } from '@/lib/graphql-client';

import { feedbackPromptDueKey } from './use-feedback-prompt';

/** Marks the caller as clicked through to Trustpilot: the prompt is never shown again. Void RPC: `{ id: '' }`. */
export async function recordTrustpilotClick(): Promise<{ id: string }> {
  const sdk = await getGraphqlSdk();
  await sdk.Record_Trustpilot_Click();
  return { id: '' };
}

export function useRecordTrustpilotClick(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recordTrustpilotClick,
    onSettled: () => queryClient.invalidateQueries({ queryKey: feedbackPromptDueKey(userId) }),
  });
}
