import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockGraphqlSdk } from '@/test/mocks/graphql-client';

vi.mock('@/lib/graphql-client', async () => {
  const actual = await vi.importActual<typeof import('@/test/mocks/graphql-client')>(
    '@/test/mocks/graphql-client',
  );
  return actual;
});

import { recordFeedbackPrompt } from './use-record-feedback-prompt';

describe('recordFeedbackPrompt', () => {
  beforeEach(() => {
    mockGraphqlSdk.Record_Feedback_Prompt = vi.fn();
  });

  it('returns true when the prompt was recorded', async () => {
    mockGraphqlSdk.Record_Feedback_Prompt = vi.fn().mockResolvedValue({ record_feedback_prompt: 'recorded' });
    await expect(recordFeedbackPrompt()).resolves.toBe(true);
  });

  it('returns false when the database refused it', async () => {
    mockGraphqlSdk.Record_Feedback_Prompt = vi.fn().mockResolvedValue({ record_feedback_prompt: 'no' });
    await expect(recordFeedbackPrompt()).resolves.toBe(false);
  });
});
