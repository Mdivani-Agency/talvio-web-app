import { act, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { LlmClient } from '@lib/llm/client';
import { LlmError } from '@lib/llm/errors';

import { fullResumeContent } from '../../../test/fixtures/flow';
import { SKILL_ID } from '../../../test/fixtures/flow/ids';
import { renderHook } from '../../../test/utils/render';
import { useTailor, type TailorStart } from './use-tailor';

const SESSION_ID = '5b6c7d8e-9f0a-4b1c-8d3e-4f5a6b7c8d95';
const CONTEXT_1 = '6c7d8e9f-0a1b-4c2d-9e4f-5a6b7c8d9e06';
const CONTEXT_2 = '7d8e9f0a-1b2c-4d3e-8f5a-6b7c8d9e0f17';
const PROFILE_ID = '7a2b3c4d-5e6f-4a1b-8c2d-3e4f5a6b7c81';
const QUESTIONS_JOB = '8e9f0a1b-2c3d-4e4f-9a6b-7c8d9e0f1a28';
const TAILOR_JOB = '9f0a1b2c-3d4e-4f5a-8b7c-8d9e0f1a2b39';

const questionSet = {
  questionSetId: '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
  round: 1,
  questions: [
    { id: 'r1-q1', topicKey: 'gap', prompt: 'Have you used Kubernetes?', guidance: null, reason: 'The job asks for it.', targetSection: null, targetEntityId: null, requirementIds: ['r2'] },
  ],
};

const tailored = {
  proposal: {
    proposalId: '2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e',
    summary: 'Tailored.',
    changes: [
      {
        type: 'field',
        changeKind: 'rewrite',
        id: 'c1',
        target: { section: 'person', entityId: null, field: 'tagline' },
        originalValue: 'Builds hiring products',
        proposedValue: 'Builds data tools',
        reason: 'Matches the job.',
        confirmation: { required: false, claims: [] },
      },
    ],
    omissions: [{ id: 'o1', section: 'skills', entityId: SKILL_ID, field: null, originalValue: null, reason: 'Not needed.' }],
  },
  requirements: [{ id: 'r2', text: 'Kubernetes', kind: 'required' }],
  coverage: [{ requirementId: 'r2', status: 'missing', note: null }],
  unsupportedRequirementIds: ['r2'],
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

function fakeClient() {
  return {
    createSession: vi.fn(async () => ({
      sessionId: SESSION_ID,
      purpose: 'tailor',
      status: 'open',
      latestContext: { contextRevisionId: CONTEXT_1, sessionId: SESSION_ID },
    })),
    submitAnswers: vi.fn(async () => ({ contextRevisionId: CONTEXT_2, sessionId: SESSION_ID })),
    deleteSession: vi.fn(async () => undefined),
    createJob: vi.fn(async (request: { operation: string }) => ({
      jobId: request.operation === 'tailor_resume' ? TAILOR_JOB : QUESTIONS_JOB,
      status: 'queued',
      pollAfterMs: 500,
      replayed: false,
    })),
    getJob: vi.fn(async (jobId: string) =>
      jobId === TAILOR_JOB ? succeeded(jobId, 'tailor_resume', tailored) : succeeded(jobId, 'generate_questions', questionSet),
    ),
    cancelJob: vi.fn(),
    retryJob: vi.fn(),
  } satisfies Record<keyof LlmClient, unknown>;
}

const input: TailorStart = {
  source: { kind: 'profile', id: PROFILE_ID, revision: '2026-11-12T10:00:00.000Z' },
  document: fullResumeContent,
  look: { template: 'senior-level-modern', color: '#000000', fontSize: 'md' },
  jobPost: { text: 'We need a platform engineer.', title: 'Platform Engineer', company: 'Acme' },
  resumeName: 'Platform Engineer at Acme',
};

function setup(client = fakeClient()) {
  const view = renderHook(() => useTailor({ storageKey: 'user-1', client: client as unknown as LlmClient }));
  return { ...view, client };
}

const WAIT = { timeout: 3_000 };

describe('useTailor', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => window.localStorage.clear());

  it('runs a tailor session from the job post to a new resume preview', async () => {
    const { result, client, unmount } = setup();
    expect(result.current.step).toBe('intake');

    act(() => result.current.start(input));
    await waitFor(() => expect(result.current.step).toBe('questions'), WAIT);
    expect(client.createSession).toHaveBeenCalledWith(expect.objectContaining({
      purpose: 'tailor',
      source: expect.objectContaining({ source: input.source }),
      jobDescription: { text: input.jobPost.text, title: 'Platform Engineer', company: 'Acme', url: null },
    }));

    act(() => result.current.setUnsentAnswer('No, only Docker'));
    act(() => result.current.answerCurrent('answered'));
    expect(result.current.step).toBe('answerReview');

    act(() => result.current.requestTailoring());
    await waitFor(() => expect(result.current.step).toBe('review'), WAIT);
    expect(client.submitAnswers).toHaveBeenCalledWith(SESSION_ID, {
      baseContextRevisionId: CONTEXT_1,
      questionSetId: questionSet.questionSetId,
      answers: [{ questionId: 'r1-q1', status: 'answered', value: 'No, only Docker' }],
    });
    expect(client.createJob).toHaveBeenLastCalledWith(expect.objectContaining({
      operation: 'tailor_resume',
      contextRevisionId: CONTEXT_2,
      input: { resumeName: 'Platform Engineer at Acme' },
    }));
    expect(result.current.review?.requirements[0]?.status).toBe('missing');
    expect(result.current.preview).toMatchObject({ name: 'Platform Engineer at Acme', template: 'senior-level-modern' });
    expect(result.current.preview?.resume.profile.tagline).toBe('Builds data tools');
    expect(result.current.preview?.resume.skills).toEqual([]);

    act(() => result.current.toggleKept('o1'));
    expect(result.current.preview?.resume.skills).toEqual(fullResumeContent.skills);

    act(() => result.current.reset());
    expect(client.deleteSession).toHaveBeenCalledWith(SESSION_ID);
    expect(result.current.step).toBe('intake');
    unmount();
  });

  it('reopens the journey after a reload without a second session', async () => {
    const first = setup();
    act(() => first.result.current.start(input));
    await waitFor(() => expect(first.result.current.step).toBe('questions'), WAIT);
    first.unmount();

    const again = setup(first.client);
    expect(again.result.current.step).toBe('questions');
    expect(again.result.current.resumeName).toBe('Platform Engineer at Acme');
    expect(first.client.createSession).toHaveBeenCalledTimes(1);
    again.unmount();
  });

  it('shows the cap when the service refuses for quota', async () => {
    const client = fakeClient();
    client.createJob.mockRejectedValue(new LlmError({ code: 'quota_exceeded', message: 'Limit reached.', status: 429 }));
    const { result, unmount } = setup(client);
    act(() => result.current.start(input));
    await waitFor(() => expect(result.current.step).toBe('capped'), WAIT);
    expect(result.current.cap?.message).toBe('Limit reached.');
    unmount();
  });

  it('shows an error with Retry when the session cannot be created', async () => {
    const client = fakeClient();
    client.createSession.mockRejectedValueOnce(new LlmError({ code: 'dependency_unavailable', message: 'Try again soon.', status: 503 }));
    const { result, unmount } = setup(client);
    act(() => result.current.start(input));
    await waitFor(() => expect(result.current.step).toBe('error'), WAIT);
    expect(result.current.failure).toEqual({ stage: 'questions', message: 'Try again soon.' });

    act(() => result.current.retry());
    await waitFor(() => expect(result.current.step).toBe('questions'), WAIT);
    expect(client.createSession).toHaveBeenCalledTimes(2);
    unmount();
  });

  it('drops a session that is created after the user started over', async () => {
    const client = fakeClient();
    let answer: (value: unknown) => void = () => undefined;
    client.createSession.mockImplementationOnce(() => new Promise((resolve) => { answer = resolve as never; }));
    const { result, unmount } = setup(client);
    act(() => result.current.start(input));
    act(() => result.current.reset());
    await act(async () => {
      answer({ sessionId: SESSION_ID, purpose: 'tailor', status: 'open', latestContext: { contextRevisionId: CONTEXT_1, sessionId: SESSION_ID } });
    });
    expect(client.createJob).not.toHaveBeenCalled();
    expect(client.deleteSession).toHaveBeenCalledWith(SESSION_ID);
    expect(result.current.step).toBe('intake');
    unmount();
  });

  it('works once the user arrives after the first render, as on a reload', async () => {
    const first = setup();
    act(() => first.result.current.start(input));
    await waitFor(() => expect(first.result.current.step).toBe('questions'), WAIT);
    first.unmount();

    const view = renderHook(
      (props: { key: string | null }) => useTailor({ storageKey: props.key, client: first.client as unknown as LlmClient }),
      { initialProps: { key: null as string | null } },
    );
    expect(view.result.current.step).toBe('intake');
    view.rerender({ key: 'user-1' });
    expect(view.result.current.step).toBe('questions');
    act(() => view.result.current.setUnsentAnswer('Yes, two years'));
    act(() => view.result.current.answerCurrent('answered'));
    expect(view.result.current.step).toBe('answerReview');
    expect(view.result.current.answers).toEqual([expect.objectContaining({ questionId: 'r1-q1', value: 'Yes, two years' })]);
    view.unmount();
  });

  it('offers Retry for a journey whose session request was cut off, reusing its request id', async () => {
    const client = fakeClient();
    client.createSession.mockImplementationOnce(() => new Promise(() => undefined));
    const first = setup(client);
    act(() => first.result.current.start(input));
    expect(first.result.current.step).toBe('loadingQuestions');
    first.unmount();

    const again = setup(client);
    expect(again.result.current.step).toBe('error');
    act(() => again.result.current.retry());
    await waitFor(() => expect(again.result.current.step).toBe('questions'), WAIT);
    const ids = client.createSession.mock.calls.map((call) => (call as unknown as [{ clientRequestId: string }])[0].clientRequestId);
    expect(ids).toHaveLength(2);
    expect(ids[1]).toBe(ids[0]);
    again.unmount();
  });
});
