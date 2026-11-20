import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  FEEDBACK_COMMENT_MAX_LENGTH,
  FEEDBACK_PROMPT_INTERVAL_DAYS,
  FEEDBACK_PROMPT_MAX_PROMPTS,
  feedbackFormSchema,
  parseFeedbackPromptDue,
  parseFeedbackPromptRecorded,
} from './feedback';

const migration = readFileSync(
  join(process.cwd(), 'supabase/migrations/20261120000200_user_feedback.sql'),
  'utf8',
);

describe('feedback rules', () => {
  it('mirrors the cap in the database rule', () => {
    expect(migration).toContain(`coalesce(p_prompts_shown, 0) < ${FEEDBACK_PROMPT_MAX_PROMPTS}`);
    expect(migration).toContain(`now() - interval '${FEEDBACK_PROMPT_INTERVAL_DAYS} days'`);
    expect(migration).toContain(`between 1 and ${FEEDBACK_COMMENT_MAX_LENGTH}`);
  });

  it('accepts a trimmed message up to 2,000 characters', () => {
    expect(feedbackFormSchema.safeParse({ comment: '  The PDF cut off my last job.  ' })).toEqual({
      success: true,
      data: { comment: 'The PDF cut off my last job.' },
    });
    expect(feedbackFormSchema.safeParse({ comment: 'x'.repeat(2000) }).success).toBe(true);
  });

  it('refuses an empty message and one over 2,000 characters', () => {
    const empty = feedbackFormSchema.safeParse({ comment: '   ' });
    expect(empty.success).toBe(false);
    expect(empty.error?.issues.map((issue) => issue.path)).toEqual([['comment']]);

    const long = feedbackFormSchema.safeParse({ comment: 'x'.repeat(2001) });
    expect(long.success).toBe(false);
    expect(long.error?.issues.map((issue) => issue.path)).toEqual([['comment']]);
  });

  it('reads only the exact RPC answers as due or recorded', () => {
    expect(parseFeedbackPromptDue('due')).toBe('due');
    expect(parseFeedbackPromptDue('no')).toBe('no');
    expect(parseFeedbackPromptDue(null)).toBe('no');
    expect(parseFeedbackPromptRecorded('recorded')).toBe(true);
    expect(parseFeedbackPromptRecorded('no')).toBe(false);
    expect(parseFeedbackPromptRecorded(undefined)).toBe(false);
  });
});
