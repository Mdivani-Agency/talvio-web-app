import { act, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { LlmClient } from '@lib/llm/client';
import { LlmError } from '@lib/llm/errors';
import type { ResumeForm } from '@lib/types';

import { fullResumeContent } from '../../../test/fixtures/flow';
import { renderHook } from '../../../test/utils/render';
import { useServiceImprove } from './use-service-improve';

const KEY = 'talvio-draft-v1:resume:user:user-1:new:ai-improve';
const SESSION_ID = '5b6c7d8e-9f0a-4b1c-8d3e-4f5a6b7c8d95';
const CONTEXT_1 = '6c7d8e9f-0a1b-4c2d-9e4f-5a6b7c8d9e06';
const CONTEXT_2 = '7d8e9f0a-1b2c-4d3e-8f5a-6b7c8d9e0f17';
const RESUME_ID = '7a2b3c4d-5e6f-4a1b-8c2d-3e4f5a6b7c81';
const QUESTIONS_JOB = '8e9f0a1b-2c3d-4e4f-9a6b-7c8d9e0f1a28';
const IMPROVE_JOB = '9f0a1b2c-3d4e-4f5a-8b7c-8d9e0f1a2b39';

const questionSet = {
  questionSetId: '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
  round: 1,
  questions: [
    { id: 'r1-q1', topicKey: 'impact', prompt: 'What impact did you deliver?', guidance: 'A number helps.', reason: 'Impact.', targetSection: null, targetEntityId: null, requirementIds: [] },
    { id: 'r1-q2', topicKey: 'tools', prompt: 'Which tools mattered most?', guidance: null, reason: 'Tools.', targetSection: null, targetEntityId: null, requirementIds: [] },
  ],
};

const proposal = {
  proposalId: '2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e',
  summary: 'A clearer summary and one skill.',
  changes: [
    {
      type: 'field',
      changeKind: 'rewrite',
      id: 'change-1',
      target: { section: 'person', entityId: null, field: 'tagline' },
      originalValue: 'Builds hiring products',
      proposedValue: 'Builds hiring products people trust',
      reason: 'Clearer.',
      confirmation: { required: false, claims: [] },
    },
    {
      type: 'add_entity',
      changeKind: 'factual_addition',
      id: 'change-2',
      addition: { section: 'skills', entity: { id: 'new:skills:0', name: 'Mentoring' } },
      reason: 'From your answers.',
      confirmation: { required: true, claims: [{ id: 'claim-1', text: 'You mentor engineers.' }] },
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

function fakeClient() {
  return {
    createSession: vi.fn(async () => ({
      sessionId: SESSION_ID,
      purpose: 'improve',
      status: 'open',
      latestContext: { contextRevisionId: CONTEXT_1, sessionId: SESSION_ID },
    })),
    submitAnswers: vi.fn(async () => ({ contextRevisionId: CONTEXT_2, sessionId: SESSION_ID })),
    deleteSession: vi.fn(async () => undefined),
    createJob: vi.fn(async (request: { operation: string }) => ({
      jobId: request.operation === 'improve_resume' ? IMPROVE_JOB : QUESTIONS_JOB,
      status: 'queued',
      pollAfterMs: 500,
      replayed: false,
    })),
    getJob: vi.fn(async (jobId: string) =>
      jobId === IMPROVE_JOB
        ? succeeded(jobId, 'improve_resume', { proposal })
        : succeeded(jobId, 'generate_questions', questionSet),
    ),
    cancelJob: vi.fn(),
    retryJob: vi.fn(),
  } satisfies Record<keyof LlmClient, unknown>;
}

function setup(client = fakeClient(), resume: ResumeForm = fullResumeContent) {
  const onApply = vi.fn();
  const view = renderHook(
    (props: { resume: ResumeForm }) =>
      useServiceImprove({
        resume: props.resume,
        storageKey: KEY,
        source: { id: RESUME_ID, revision: '2026-11-12T10:00:00.000Z' },
        onApply,
        client: client as unknown as LlmClient,
      }),
    { initialProps: { resume } },
  );
  return { ...view, onApply, client };
}

const WAIT = { timeout: 3_000 };

describe('useServiceImprove', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => window.localStorage.clear());

  it('runs a session from questions to a confirmed proposal and deletes it on Accept', async () => {
    const { result, onApply, client, unmount } = setup();

    act(() => result.current.start());
    expect(result.current.step).toBe('loadingQuestions');
    await waitFor(() => expect(result.current.step).toBe('questions'), WAIT);
    expect(client.createSession).toHaveBeenCalledWith(expect.objectContaining({
      purpose: 'improve',
      source: expect.objectContaining({
        source: expect.objectContaining({ kind: 'resume', id: RESUME_ID, revision: '2026-11-12T10:00:00.000Z', state: 'draft' }),
        document: expect.objectContaining({ person: expect.objectContaining({ tagline: 'Builds hiring products' }) }),
      }),
    }));
    expect(client.createJob).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'generate_questions',
      sessionId: SESSION_ID,
      contextRevisionId: CONTEXT_1,
      input: { analysisJobId: null, round: 1, maxQuestions: 5 },
    }));
    expect(result.current.questions).toEqual([
      { id: 'r1-q1', question: 'What impact did you deliver?', example: 'A number helps.' },
      { id: 'r1-q2', question: 'Which tools mattered most?', example: 'Tools.' },
    ]);

    act(() => result.current.setUnsentAnswer('Mentored four engineers'));
    act(() => result.current.answerCurrent('answered'));
    act(() => result.current.answerCurrent('skipped'));
    expect(result.current.step).toBe('answerReview');

    act(() => result.current.requestProposal());
    await waitFor(() => expect(result.current.step).toBe('proposalReview'), WAIT);
    expect(client.submitAnswers).toHaveBeenCalledWith(SESSION_ID, {
      baseContextRevisionId: CONTEXT_1,
      questionSetId: questionSet.questionSetId,
      answers: [
        { questionId: 'r1-q1', status: 'answered', value: 'Mentored four engineers' },
        { questionId: 'r1-q2', status: 'skipped' },
      ],
    });
    expect(client.createJob).toHaveBeenLastCalledWith(expect.objectContaining({
      operation: 'improve_resume',
      contextRevisionId: CONTEXT_2,
      input: { sections: [], targetRole: null },
    }));
    expect(result.current.review?.changes.map((change) => change.needsConfirmation)).toEqual([false, true]);

    act(() => result.current.toggleConfirmed('change-2'));
    act(() => result.current.accept());
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply.mock.calls[0]![0].profile.tagline).toBe('Builds hiring products people trust');
    expect(onApply.mock.calls[0]![0].skills.at(-1)).toEqual({ name: 'Mentoring' });
    expect(client.deleteSession).toHaveBeenCalledWith(SESSION_ID);
    expect(result.current.step).toBe('idle');
    unmount();
  });

  it('leaves an unconfirmed addition out', async () => {
    const { result, onApply, unmount } = setup();
    act(() => result.current.start());
    await waitFor(() => expect(result.current.step).toBe('questions'), WAIT);
    act(() => result.current.answerCurrent('skipped'));
    act(() => result.current.answerCurrent('skipped'));
    act(() => result.current.requestProposal());
    await waitFor(() => expect(result.current.step).toBe('proposalReview'), WAIT);
    act(() => result.current.accept());
    expect(onApply.mock.calls[0]![0].skills).toEqual(fullResumeContent.skills);
    unmount();
  });

  it('reopens at the same question after a reload without a second session', async () => {
    const first = setup();
    act(() => first.result.current.start());
    await waitFor(() => expect(first.result.current.step).toBe('questions'), WAIT);
    act(() => first.result.current.setUnsentAnswer('Half typed'));
    first.unmount();

    const again = setup(first.client);
    expect(again.result.current.step).toBe('questions');
    expect(again.result.current.unsentAnswer).toBe('Half typed');
    expect(first.client.createSession).toHaveBeenCalledTimes(1);
    again.unmount();
  });

  it('shows the cap when the service refuses the job for quota', async () => {
    const client = fakeClient();
    client.createJob.mockRejectedValue(new LlmError({ code: 'quota_exceeded', message: 'Limit reached.', status: 429 }));
    const { result, unmount } = setup(client);
    act(() => result.current.start());
    await waitFor(() => expect(result.current.step).toBe('capped'), WAIT);
    expect(result.current.cap?.message).toBe('Limit reached.');
    unmount();
  });

  it('starts a new session on Retry when the service no longer has the old one', async () => {
    const client = fakeClient();
    client.submitAnswers.mockRejectedValueOnce(new LlmError({ code: 'not_found', message: 'Not found.', status: 404 }));
    const { result, unmount } = setup(client);
    act(() => result.current.start());
    await waitFor(() => expect(result.current.step).toBe('questions'), WAIT);
    act(() => result.current.setUnsentAnswer('Something'));
    act(() => result.current.answerCurrent('answered'));
    act(() => result.current.answerCurrent('skipped'));
    act(() => result.current.requestProposal());
    await waitFor(() => expect(result.current.step).toBe('error'), WAIT);
    expect(result.current.failure?.message).toMatch(/session ended/);

    act(() => result.current.retry());
    await waitFor(() => expect(result.current.step).toBe('questions'), WAIT);
    expect(client.createSession).toHaveBeenCalledTimes(2);
    unmount();
  });

  it('keeps a failed proposal job a proposal job across a reload, so Retry reaches the review', async () => {
    const client = fakeClient();
    const failedOnce = {
      ...succeeded(IMPROVE_JOB, 'improve_resume', null),
      status: 'failed',
      result: null,
      error: { code: 'dependency_unavailable', message: 'Busy.', retryable: true },
    };
    client.getJob.mockImplementation(async (jobId: string) =>
      jobId === IMPROVE_JOB ? (failedOnce as never) : succeeded(jobId, 'generate_questions', questionSet),
    );
    const first = setup(client);
    act(() => first.result.current.start());
    await waitFor(() => expect(first.result.current.step).toBe('questions'), WAIT);
    act(() => first.result.current.answerCurrent('skipped'));
    act(() => first.result.current.answerCurrent('skipped'));
    act(() => first.result.current.requestProposal());
    await waitFor(() => expect(first.result.current.step).toBe('error'), WAIT);
    first.unmount();

    client.retryJob.mockResolvedValue({ jobId: IMPROVE_JOB, status: 'queued', pollAfterMs: 500 } as never);
    const again = setup(client);
    act(() => again.result.current.start());
    await waitFor(() => expect(again.result.current.step).toBe('error'), WAIT);
    client.getJob.mockImplementation(async (jobId: string) =>
      jobId === IMPROVE_JOB ? succeeded(jobId, 'improve_resume', { proposal }) : succeeded(jobId, 'generate_questions', questionSet),
    );
    act(() => again.result.current.retry());
    await waitFor(() => expect(again.result.current.step).toBe('proposalReview'), WAIT);
    again.unmount();
  });

  it('drops a session that is created after the user closed Improve', async () => {
    const client = fakeClient();
    let answer: (value: unknown) => void = () => undefined;
    client.createSession.mockImplementationOnce(() => new Promise((resolve) => { answer = resolve as never; }));
    const { result, unmount } = setup(client);
    act(() => result.current.start());
    expect(result.current.step).toBe('loadingQuestions');
    act(() => result.current.cancel());
    await act(async () => {
      answer({ sessionId: SESSION_ID, purpose: 'improve', status: 'open', latestContext: { contextRevisionId: CONTEXT_1, sessionId: SESSION_ID } });
    });
    expect(client.createJob).not.toHaveBeenCalled();
    expect(client.deleteSession).toHaveBeenCalledWith(SESSION_ID);
    expect(window.localStorage.getItem(`talvio-llm-improve:v1:${KEY}`)).toBeNull();
    expect(result.current.step).toBe('idle');
    unmount();
  });

  it('drops a change whose text was edited after the proposal arrived', async () => {
    const { result, rerender, onApply, unmount } = setup();
    act(() => result.current.start());
    await waitFor(() => expect(result.current.step).toBe('questions'), WAIT);
    act(() => result.current.answerCurrent('skipped'));
    act(() => result.current.answerCurrent('skipped'));
    act(() => result.current.requestProposal());
    await waitFor(() => expect(result.current.step).toBe('proposalReview'), WAIT);

    const edited = { ...fullResumeContent, profile: { ...fullResumeContent.profile, tagline: 'My own words' } };
    rerender({ resume: edited });
    expect(result.current.review?.changes.map((change) => change.id)).toEqual(['change-2']);
    expect(result.current.review?.skipped).toBe(1);
    act(() => result.current.accept());
    expect(onApply).not.toHaveBeenCalled();
    unmount();
  });
});
