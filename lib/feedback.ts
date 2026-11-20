import { z } from 'zod';

/**
 * The review prompt rules (MDI-650). The database is the source of truth: `feedback_prompt_rule()` in
 * `supabase/migrations/20261120000300_user_feedback.sql` enforces them in `record_feedback_prompt`. These constants
 * mirror it for the client and its tests; change both together.
 */
export const FEEDBACK_PROMPT_MAX_PROMPTS = 3;
export const FEEDBACK_PROMPT_INTERVAL_DAYS = 30;
/** `user_feedback.comment` is 1 to 2,000 characters after trimming. */
export const FEEDBACK_COMMENT_MAX_LENGTH = 2000;

export const FEEDBACK_COMMENT_REQUIRED = 'Write a few words about what went wrong';
export const feedbackCommentTooLong = (max: number) => `Keep it under ${max.toLocaleString('en-US')} characters`;

/** The "Tell us what went wrong" form. */
export const feedbackFormSchema = z.object({
  comment: z
    .string()
    .trim()
    .min(1, FEEDBACK_COMMENT_REQUIRED)
    .max(FEEDBACK_COMMENT_MAX_LENGTH, feedbackCommentTooLong(FEEDBACK_COMMENT_MAX_LENGTH)),
});

export type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

/** What `feedback_prompt_due` and `record_feedback_prompt` return. Anything else counts as "no". */
export type FeedbackPromptDue = 'due' | 'no';

export function parseFeedbackPromptDue(value: unknown): FeedbackPromptDue {
  return value === 'due' ? 'due' : 'no';
}

export function parseFeedbackPromptRecorded(value: unknown): boolean {
  return value === 'recorded';
}
