import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseFeedbackPromptRecorded } from '@/lib/feedback';
import { getGraphqlSdk } from '@/lib/graphql-client';

import { feedbackPromptDueKey } from './use-feedback-prompt';

/** Counts a shown prompt. `false` when the database refused it (cap reached in another tab, or already clicked). */
export async function recordFeedbackPrompt(): Promise<boolean> {
  const sdk = await getGraphqlSdk();
  const data = await sdk.Record_Feedback_Prompt();
  return parseFeedbackPromptRecorded(data.record_feedback_prompt);
}

export function useRecordFeedbackPrompt(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recordFeedbackPrompt,
    onSettled: () => queryClient.invalidateQueries({ queryKey: feedbackPromptDueKey(userId) }),
  });
}
