import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockGraphqlSdk } from '@/test/mocks/graphql-client';

vi.mock('@/lib/graphql-client', async () => {
  const actual = await vi.importActual<typeof import('@/test/mocks/graphql-client')>(
    '@/test/mocks/graphql-client',
  );
  return actual;
});

import { fetchFeedbackPromptDue, feedbackPromptDueKey } from './use-feedback-prompt';

describe('fetchFeedbackPromptDue', () => {
  beforeEach(() => {
    mockGraphqlSdk.Feedback_Prompt_Due = vi.fn();
  });

  it('returns due when the database says due', async () => {
    mockGraphqlSdk.Feedback_Prompt_Due = vi.fn().mockResolvedValue({ feedback_prompt_due: 'due' });
    await expect(fetchFeedbackPromptDue()).resolves.toBe('due');
  });

  it('treats no and a missing answer as not due', async () => {
    mockGraphqlSdk.Feedback_Prompt_Due = vi.fn().mockResolvedValue({ feedback_prompt_due: 'no' });
    await expect(fetchFeedbackPromptDue()).resolves.toBe('no');
    mockGraphqlSdk.Feedback_Prompt_Due = vi.fn().mockResolvedValue({ feedback_prompt_due: null });
    await expect(fetchFeedbackPromptDue()).resolves.toBe('no');
  });

  it('passes a failed call to the caller', async () => {
    mockGraphqlSdk.Feedback_Prompt_Due = vi.fn().mockRejectedValue(new Error('offline'));
    await expect(fetchFeedbackPromptDue()).rejects.toThrow('offline');
  });

  it('keys the query by user', () => {
    expect(feedbackPromptDueKey('user-1')).toEqual(['feedback-prompt-due', 'user-1']);
  });
});
