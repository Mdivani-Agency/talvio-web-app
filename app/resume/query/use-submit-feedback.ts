import { useMutation } from '@tanstack/react-query';

import { getGraphqlSdk } from '@/lib/graphql-client';

export type SubmitFeedbackInput = {
  comment: string;
  /** The resume the PDF was generated from. Must be the caller's, or null. */
  resumeId?: string | null;
};

/** Stores a "Tell us what went wrong" message. Returns `{ id }` for `submitWrapper`. */
export async function submitFeedback({ comment, resumeId }: SubmitFeedbackInput): Promise<{ id: string }> {
  const sdk = await getGraphqlSdk();
  const data = await sdk.Submit_Feedback({ p_comment: comment.trim(), p_resume_id: resumeId ?? null });
  if (!data.submit_feedback) {
    throw new Error('Feedback was not saved');
  }
  return { id: data.submit_feedback };
}

export function useSubmitFeedback() {
  // Sending a message does not change the prompt state, so there is no query to refresh.
  return useMutation({ mutationFn: submitFeedback });
}
