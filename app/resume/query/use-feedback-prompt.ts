import { getGraphqlSdk } from '@/lib/graphql-client';
import { parseFeedbackPromptDue, type FeedbackPromptDue } from '@/lib/feedback';
import { useGraphqlQuery } from '@/lib/query/base-query';

export const feedbackPromptDueKey = (userId?: string) => ['feedback-prompt-due', userId] as const;

/**
 * Whether the signed-in user may be shown the review prompt now (MDI-652). `feedback_prompt_due` is a VOLATILE RPC, so
 * pg_graphql exposes it as a mutation even though it only reads.
 */
export async function fetchFeedbackPromptDue(): Promise<FeedbackPromptDue> {
  const sdk = await getGraphqlSdk();
  const data = await sdk.Feedback_Prompt_Due();
  return parseFeedbackPromptDue(data.feedback_prompt_due);
}

export function useFeedbackPromptDue(userId?: string) {
  return useGraphqlQuery(feedbackPromptDueKey(userId), () => fetchFeedbackPromptDue(), {
    enabled: !!userId,
    staleTime: 0,
  });
}
