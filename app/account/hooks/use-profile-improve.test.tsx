import { act, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mockGraphqlSdk } from '@/test/mocks/graphql-client';
import type { LlmClient } from '@lib/llm/client';
import { LlmError } from '@lib/llm/errors';
import type { Account } from '@lib/types';

import { EXPERIENCE_ID, FLOW_USER_ID, savedAccount } from '../../../test/fixtures/flow';
import { renderHook } from '../../../test/utils/render';

vi.mock('@/lib/graphql-client', async () => {
  const actual = await vi.importActual<typeof import('@/test/mocks/graphql-client')>('@/test/mocks/graphql-client');
  return { ...actual, shouldRetryGraphqlQuery: () => false };
});
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { useProfileImprove } from './use-profile-improve';

const SESSION_ID = '5b6c7d8e-9f0a-4b1c-8d3e-4f5a6b7c8d95';
const CONTEXT_1 = '6c7d8e9f-0a1b-4c2d-9e4f-5a6b7c8d9e06';
const CONTEXT_2 = '7d8e9f0a-1b2c-4d3e-8f5a-6b7c8d9e0f17';
const ANALYSIS_JOB = '1e9f0a1b-2c3d-4e4f-9a6b-7c8d9e0f1a28';
const QUESTIONS_JOB = '8e9f0a1b-2c3d-4e4f-9a6b-7c8d9e0f1a28';
const IMPROVE_JOB = '9f0a1b2c-3d4e-4f5a-8b7c-8d9e0f1a2b39';
const STORED_SESSION = `talvio-llm-improve:v1:profile:user:${FLOW_USER_ID}`;

const questionSet = (count = 2) => ({
  questionSetId: '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
  round: 1,
  questions: [
    { id: 'r1-q1', topicKey: 'impact', prompt: 'How much faster did PDFs render?', guidance: 'A number helps.', reason: 'Impact.', targetSection: 'experience', targetEntityId: EXPERIENCE_ID },
    { id: 'r1-q2', topicKey: 'people', prompt: 'Do you mentor anyone?', guidance: null, reason: 'Leadership.', targetSection: null, targetEntityId: null },
  ].slice(0, count),
});

const proposal = {
  proposalId: '2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e',
  summary: 'A clearer summary and a measured result.',
  changes: [
    {
      type: 'field',
      id: 'tagline',
      target: { section: 'person', entityId: null, field: 'tagline' },
      originalValue: 'Builds hiring products',
      proposedValue: 'Builds hiring products people trust',
      reason: 'Clearer.',
      confirmation: { required: false, claims: [] },
    },
    {
      type: 'field',
      id: 'achievements',
      target: { section: 'experience', entityId: EXPERIENCE_ID, field: 'achievements' },
      originalValue: ['Cut PDF render time'],
      proposedValue: ['Cut PDF render time by 60%'],
      reason: 'From your answer.',
      confirmation: { required: true, claims: [{ id: 'claim-60', text: 'Render time fell by 60%.' }] },
    },
    {
      type: 'field',
      id: 'stale-role',
      target: { section: 'person', entityId: null, field: 'role' },
      originalValue: 'Senior Engineer',
      proposedValue: 'Principal Engineer',
      reason: 'Made for an older profile.',
      confirmation: { required: false, claims: [] },
    },
  ],
};

function succeeded(jobId: string, operation: string, result: unknown) {
  return {
    jobId,
    operation,
    status: 'succeeded',
    stage: 'done',
    deadlineAt: new Date(Date.now() + 600_000).toISOString(),
    pollAfterMs: null,
    result: { jobId, operation, resultKind: 'complete', warnings: [], result },
    error: null,
  };
}

const JOB_FOR: Record<string, string> = {
  analyze_resume: ANALYSIS_JOB,
  generate_questions: QUESTIONS_JOB,
  improve_profile: IMPROVE_JOB,
};

function fakeClient(questions = questionSet()) {
  return {
    createSession: vi.fn(async () => ({
      sessionId: SESSION_ID,
      purpose: 'improve',
      status: 'open',
      latestContext: { contextRevisionId: CONTEXT_1, sessionId: SESSION_ID },
    })),
    submitAnswers: vi.fn(async () => ({ contextRevisionId: CONTEXT_2, sessionId: SESSION_ID })),
    getSession: vi.fn(async () => ({
      sessionId: SESSION_ID,
      purpose: 'improve',
      status: 'open',
      latestContext: { contextRevisionId: CONTEXT_1, sessionId: SESSION_ID, answerRevisionId: null as string | null },
    })),
    deleteSession: vi.fn(async () => undefined),
    createJob: vi.fn(async (request: { operation: string }) => ({
      jobId: JOB_FOR[request.operation],
      status: 'queued',
      pollAfterMs: 500,
      replayed: false,
    })),
    getJob: vi.fn(async (jobId: string) => {
      if (jobId === ANALYSIS_JOB) return succeeded(jobId, 'analyze_resume', { findings: [], priorities: [] });
      if (jobId === QUESTIONS_JOB) return succeeded(jobId, 'generate_questions', questions);
      return succeeded(jobId, 'improve_profile', { proposal });
    }),
    cancelJob: vi.fn(),
    retryJob: vi.fn(),
  } satisfies Record<keyof LlmClient, unknown>;
}

function setup(client = fakeClient(), account: Account = savedAccount) {
  const view = renderHook(
    () => useProfileImprove({ userId: FLOW_USER_ID, account, client: client as unknown as LlmClient }),
  );
  return { ...view, client };
}

function operations(client: ReturnType<typeof fakeClient>) {
  return client.createJob.mock.calls.map(([request]) => request.operation);
}

const WAIT = { timeout: 4_000 };

describe('useProfileImprove', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockGraphqlSdk.ProfileImprovement = vi.fn().mockResolvedValue({ profile_ai_improvementsCollection: { edges: [] } });
    mockGraphqlSdk.Apply_Llm_Proposal = vi.fn().mockResolvedValue({
      apply_llm_proposal: JSON.stringify({
        receiptId: '3c4d5e6f-7a8b-4c9d-8e0f-1a2b3c4d5e6f',
        proposalId: proposal.proposalId,
        target: { kind: 'profile', profileId: FLOW_USER_ID },
        resultingRevision: '2026-11-20T10:00:00.000Z',
        appliedChangeIds: ['tagline', 'achievements'],
        acceptedOmissionIds: [],
        replayed: false,
      }),
    });
  });
  afterEach(() => window.localStorage.clear());

  it('runs one session, three jobs, one answers call and one delete, and saves the selected changes', async () => {
    const { result, client, unmount } = setup();
    await waitFor(() => expect(result.current.improvement?.available).toBe(true));

    act(() => result.current.start());
    await waitFor(() => expect(result.current.step).toBe('questions'), WAIT);
    expect(client.createSession).toHaveBeenCalledWith(expect.objectContaining({
      purpose: 'improve',
      source: expect.objectContaining({
        source: { kind: 'profile', id: FLOW_USER_ID, revision: savedAccount.updatedAt },
        document: expect.objectContaining({ person: expect.objectContaining({ role: 'Staff Engineer' }) }),
      }),
    }));
    expect(client.createJob).toHaveBeenNthCalledWith(1, expect.objectContaining({
      operation: 'analyze_resume',
      contextRevisionId: CONTEXT_1,
      input: { sections: [] },
    }));
    expect(client.createJob).toHaveBeenNthCalledWith(2, expect.objectContaining({
      operation: 'generate_questions',
      input: { analysisJobId: ANALYSIS_JOB, round: 1, maxQuestions: 5 },
    }));

    act(() => result.current.setUnsentAnswer('About 60% faster'));
    act(() => result.current.answerCurrent('answered'));
    act(() => result.current.answerCurrent('skipped'));
    await waitFor(() => expect(result.current.step).toBe('review'), WAIT);
    expect(client.submitAnswers).toHaveBeenCalledWith(SESSION_ID, {
      baseContextRevisionId: CONTEXT_1,
      questionSetId: questionSet().questionSetId,
      answers: [
        { questionId: 'r1-q1', status: 'answered', value: 'About 60% faster' },
        { questionId: 'r1-q2', status: 'skipped' },
      ],
    });
    expect(client.createJob).toHaveBeenLastCalledWith(expect.objectContaining({
      operation: 'improve_profile',
      contextRevisionId: CONTEXT_2,
      input: { sections: [], targetRole: 'Staff Engineer' },
    }));

    // The change made for an older profile is dropped; the rest start selected.
    expect(result.current.review?.changes.map((change) => [change.id, change.selected])).toEqual([
      ['tagline', true],
      ['achievements', true],
    ]);
    expect(result.current.review?.skipped).toBe(1);
    // A selected change with an unconfirmed claim blocks Save.
    expect(result.current.canSave).toBe(false);
    act(() => result.current.toggleConfirmed('achievements'));
    expect(result.current.canSave).toBe(true);

    await act(async () => {
      await result.current.save();
    });
    const request = JSON.parse((mockGraphqlSdk.Apply_Llm_Proposal as ReturnType<typeof vi.fn>).mock.calls[0]![0].p_request);
    expect(request).toMatchObject({
      operation: 'improve_profile',
      proposalId: proposal.proposalId,
      jobId: IMPROVE_JOB,
      sessionId: SESSION_ID,
      target: { kind: 'profile', profileId: FLOW_USER_ID, baseRevision: savedAccount.updatedAt },
      selectedChangeIds: ['tagline', 'achievements'],
      confirmedClaimIds: ['claim-60'],
    });
    expect(request.profile.profile.tagline).toBe('Builds hiring products people trust');
    expect(request.profile.experience[0].achievements).toEqual(['Cut PDF render time by 60%']);
    expect(result.current.step).toBe('done');

    expect(client.createSession).toHaveBeenCalledTimes(1);
    expect(operations(client)).toEqual(['analyze_resume', 'generate_questions', 'improve_profile']);
    expect(client.submitAnswers).toHaveBeenCalledTimes(1);
    expect(client.deleteSession).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(STORED_SESSION)).toBeNull();
    unmount();
  });

  it('saves only the changes the user kept', async () => {
    const { result, unmount } = setup();
    act(() => result.current.start());
    await waitFor(() => expect(result.current.step).toBe('questions'), WAIT);
    act(() => result.current.skipRemaining());
    await waitFor(() => expect(result.current.step).toBe('review'), WAIT);

    act(() => result.current.toggleSelected('achievements'));
    expect(result.current.canSave).toBe(true);
    await act(async () => {
      await result.current.save();
    });
    const request = JSON.parse((mockGraphqlSdk.Apply_Llm_Proposal as ReturnType<typeof vi.fn>).mock.calls[0]![0].p_request);
    expect(request.selectedChangeIds).toEqual(['tagline']);
    expect(request.confirmedClaimIds).toEqual([]);
    expect(request.profile.experience[0].achievements).toEqual(['Cut PDF render time']);
    unmount();
  });

  it('sends every question as skipped when the user skips them all', async () => {
    const { result, client, unmount } = setup();
    act(() => result.current.start());
    await waitFor(() => expect(result.current.step).toBe('questions'), WAIT);
    act(() => result.current.skipRemaining());
    await waitFor(() => expect(result.current.step).toBe('review'), WAIT);
    expect(client.submitAnswers).toHaveBeenCalledWith(SESSION_ID, expect.objectContaining({
      answers: [
        { questionId: 'r1-q1', status: 'skipped' },
        { questionId: 'r1-q2', status: 'skipped' },
      ],
    }));
    unmount();
  });

  it('goes to "nothing to ask" on zero questions, then asks for suggestions without answers', async () => {
    const client = fakeClient(questionSet(0));
    const { result, unmount } = setup(client);
    act(() => result.current.start());
    await waitFor(() => expect(result.current.step).toBe('nothingToAsk'), WAIT);
    act(() => result.current.requestProposal());
    await waitFor(() => expect(result.current.step).toBe('review'), WAIT);
    expect(client.submitAnswers).not.toHaveBeenCalled();
    expect(client.createJob).toHaveBeenLastCalledWith(expect.objectContaining({ operation: 'improve_profile', contextRevisionId: CONTEXT_1 }));
    unmount();
  });

  it('resumes at the same question with the typed answer after a reload', async () => {
    const first = setup();
    act(() => first.result.current.start());
    await waitFor(() => expect(first.result.current.step).toBe('questions'), WAIT);
    act(() => first.result.current.answerCurrent('skipped'));
    act(() => first.result.current.setUnsentAnswer('I mentor two engineers'));
    first.unmount();

    const second = setup(first.client);
    expect(second.result.current.step).toBe('questions');
    expect(second.result.current.currentQuestionId).toBe('r1-q2');
    expect(second.result.current.unsentAnswer).toBe('I mentor two engineers');
    expect(first.client.createSession).toHaveBeenCalledTimes(1);
    second.unmount();
  });

  it('requests the suggestions again after a reload while the answers were being sent', async () => {
    const client = fakeClient();
    client.submitAnswers.mockImplementationOnce(() => new Promise(() => undefined));
    const first = setup(client);
    act(() => first.result.current.start());
    await waitFor(() => expect(first.result.current.step).toBe('questions'), WAIT);
    act(() => first.result.current.skipRemaining());
    expect(first.result.current.step).toBe('loadingProposal');
    first.unmount();

    const second = setup(client);
    await waitFor(() => expect(second.result.current.step).toBe('review'), WAIT);
    expect(client.submitAnswers).toHaveBeenCalledTimes(2);
    expect(operations(client).filter((operation) => operation === 'improve_profile')).toHaveLength(1);
    second.unmount();
  });

  it('carries on from the stored answers when they arrived before a reload', async () => {
    const client = fakeClient();
    // The first submission reaches the service but its reply is lost; a repeat is stale.
    client.submitAnswers.mockImplementationOnce(() => new Promise(() => undefined));
    client.submitAnswers.mockRejectedValueOnce(
      new LlmError({ code: 'stale_context', message: 'This changed since you started. Start again.', status: 409 }),
    );
    client.getSession.mockResolvedValueOnce({
      sessionId: SESSION_ID,
      purpose: 'improve',
      status: 'open',
      latestContext: { contextRevisionId: CONTEXT_2, sessionId: SESSION_ID, answerRevisionId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' },
    });
    const first = setup(client);
    act(() => first.result.current.start());
    await waitFor(() => expect(first.result.current.step).toBe('questions'), WAIT);
    act(() => first.result.current.skipRemaining());
    first.unmount();

    const second = setup(client);
    await waitFor(() => expect(second.result.current.step).toBe('review'), WAIT);
    expect(client.getSession).toHaveBeenCalledWith(SESSION_ID);
    const improve = client.createJob.mock.calls.find(([request]) => request.operation === 'improve_profile');
    expect(improve?.[0]).toMatchObject({ contextRevisionId: CONTEXT_2 });
    second.unmount();
  });

  it('shows the error when the answers are stale and the service has none of them', async () => {
    const client = fakeClient();
    client.submitAnswers.mockRejectedValueOnce(
      new LlmError({ code: 'stale_context', message: 'This changed since you started. Start again.', status: 409 }),
    );
    const view = setup(client);
    act(() => view.result.current.start());
    await waitFor(() => expect(view.result.current.step).toBe('questions'), WAIT);
    act(() => view.result.current.skipRemaining());
    await waitFor(() => expect(view.result.current.failure?.message).toBe('This changed since you started. Start again.'), WAIT);
    expect(operations(client)).not.toContain('improve_profile');
    view.unmount();
  });

  it('restarts the analysis after a reload while the session was being created', async () => {
    const client = fakeClient();
    client.createSession.mockImplementationOnce(() => new Promise(() => undefined));
    const first = setup(client);
    act(() => first.result.current.start());
    expect(first.result.current.step).toBe('loading');
    first.unmount();

    const second = setup(client);
    await waitFor(() => expect(second.result.current.step).toBe('questions'), WAIT);
    expect(client.createSession).toHaveBeenCalledTimes(2);
    const [[firstRequest], [secondRequest]] = client.createSession.mock.calls as unknown as [[{ clientRequestId: string }], [{ clientRequestId: string }]];
    expect(secondRequest.clientRequestId).toBe(firstRequest.clientRequestId);
    second.unmount();
  });

  it('keeps a typed answer when going back a question and forward again', async () => {
    const { result, unmount } = setup();
    act(() => result.current.start());
    await waitFor(() => expect(result.current.step).toBe('questions'), WAIT);
    act(() => result.current.answerCurrent('skipped'));
    act(() => result.current.setUnsentAnswer('I mentor two engineers'));
    act(() => result.current.goToPreviousQuestion());
    expect(result.current.currentQuestionId).toBe('r1-q1');
    act(() => result.current.answerCurrent('skipped'));
    expect(result.current.currentQuestionId).toBe('r1-q2');
    expect(result.current.unsentAnswer).toBe('I mentor two engineers');
    unmount();
  });

  it('starts nothing once the improvement is used', async () => {
    mockGraphqlSdk.ProfileImprovement = vi.fn().mockResolvedValue({
      profile_ai_improvementsCollection: { edges: [{ node: { used_at: '2026-11-19T09:00:00Z', applied_at: null } }] },
    });
    const { result, client, unmount } = setup();
    await waitFor(() => expect(result.current.improvement?.used).toBe(true));
    act(() => result.current.start());
    expect(result.current.step).toBe('used');
    expect(client.createSession).not.toHaveBeenCalled();
    unmount();
  });

  it.each([
    ['quota_exceeded', 'limit'],
    ['profile_improvement_used', 'used'],
    ['operation_limit_reached', 'used'],
  ])('shows %s from the suggestions request as %s', async (code, step) => {
    const client = fakeClient();
    client.createJob.mockImplementation(async (request: { operation: string }) => {
      if (request.operation === 'improve_profile') {
        throw new LlmError({ code, message: 'Refused.', status: code === 'profile_improvement_used' ? 403 : 429 });
      }
      return { jobId: JOB_FOR[request.operation], status: 'queued', pollAfterMs: 500, replayed: false };
    });
    const { result, unmount } = setup(client);
    act(() => result.current.start());
    await waitFor(() => expect(result.current.step).toBe('questions'), WAIT);
    act(() => result.current.skipRemaining());
    await waitFor(() => expect(result.current.step).toBe(step), WAIT);
    unmount();
  });

  it('repeats the suggestions request with the same Idempotency-Key after a timeout', async () => {
    const client = fakeClient();
    let improveCalls = 0;
    client.createJob.mockImplementation(async (request: { operation: string }) => {
      if (request.operation === 'improve_profile' && improveCalls++ === 0) {
        throw new LlmError({ code: 'dependency_unavailable', message: 'Later.', retryable: true, status: 503 });
      }
      return { jobId: JOB_FOR[request.operation], status: 'queued', pollAfterMs: 500, replayed: improveCalls > 1 };
    });
    const { result, unmount } = setup(client);
    act(() => result.current.start());
    await waitFor(() => expect(result.current.step).toBe('questions'), WAIT);
    act(() => result.current.skipRemaining());
    await waitFor(() => expect(result.current.step).toBe('review'), { timeout: 8_000 });

    const keys = client.createJob.mock.calls
      .map(([request]) => request as { operation: string; clientRequestId: string })
      .filter((request) => request.operation === 'improve_profile')
      .map((request) => request.clientRequestId);
    expect(keys).toHaveLength(2);
    expect(keys[0]).toBe(keys[1]);
    unmount();
  }, 12_000);

  it('leaves the improvement unused when stopped before the suggestions', async () => {
    const { result, client, unmount } = setup();
    act(() => result.current.start());
    await waitFor(() => expect(result.current.step).toBe('questions'), WAIT);
    act(() => result.current.stop());
    expect(result.current.step).toBe('idle');
    expect(operations(client)).not.toContain('improve_profile');
    expect(client.deleteSession).toHaveBeenCalledWith(SESSION_ID);
    unmount();
  });
});
