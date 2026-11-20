import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockGraphqlSdk } from '@/test/mocks/graphql-client';

vi.mock('@/lib/graphql-client', async () => {
  const actual = await vi.importActual<typeof import('@/test/mocks/graphql-client')>(
    '@/test/mocks/graphql-client',
  );
  return actual;
});

import { submitFeedback } from './use-submit-feedback';

const RESUME_ID = '11111111-1111-4111-8111-111111111111';

describe('submitFeedback', () => {
  beforeEach(() => {
    mockGraphqlSdk.Submit_Feedback = vi.fn();
  });

  it('sends the trimmed message with the resume and returns the new id', async () => {
    mockGraphqlSdk.Submit_Feedback = vi.fn().mockResolvedValue({ submit_feedback: 'feedback-1' });

    await expect(submitFeedback({ comment: '  It cut off my last job.  ', resumeId: RESUME_ID })).resolves.toEqual({
      id: 'feedback-1',
    });
    expect(mockGraphqlSdk.Submit_Feedback).toHaveBeenCalledWith({
      p_comment: 'It cut off my last job.',
      p_resume_id: RESUME_ID,
    });
  });

  it('sends a null resume when there is none', async () => {
    mockGraphqlSdk.Submit_Feedback = vi.fn().mockResolvedValue({ submit_feedback: 'feedback-2' });
    await submitFeedback({ comment: 'Hello' });
    expect(mockGraphqlSdk.Submit_Feedback).toHaveBeenCalledWith({ p_comment: 'Hello', p_resume_id: null });
  });

  it('throws when no id comes back', async () => {
    mockGraphqlSdk.Submit_Feedback = vi.fn().mockResolvedValue({ submit_feedback: null });
    await expect(submitFeedback({ comment: 'Hello' })).rejects.toThrow('Feedback was not saved');
  });

  it('passes a refused message to the caller', async () => {
    mockGraphqlSdk.Submit_Feedback = vi.fn().mockRejectedValue(new Error('invalid_feedback'));
    await expect(submitFeedback({ comment: 'Hello' })).rejects.toThrow('invalid_feedback');
  });
});
