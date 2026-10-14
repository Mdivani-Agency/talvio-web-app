import { act, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AiCapError } from '@lib/ai-cap';
import { documentHash } from '@lib/ai-improve/payload';
import type { ResumeForm } from '@lib/types';

import { fullResumeContent } from '../../../test/fixtures/flow';
import { renderHook } from '../../../test/utils/render';

const { fetchQuestions, fetchAccountProposal } = vi.hoisted(() => ({
  fetchQuestions: vi.fn(),
  fetchAccountProposal: vi.fn(),
}));

vi.mock('@lib/clients/llm.client', () => ({ fetchQuestions, fetchAccountProposal }));

import { useAiImprove } from './use-ai-improve';

const KEY = 'talvio-draft-v1:resume:user:user-1:new:ai-improve';
const QUESTIONS = [
  { question: 'What impact did you deliver?', example: 'Cut costs' },
  { question: 'Which tools mattered most?', example: 'Postgres' },
];

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function setup(resume: ResumeForm = fullResumeContent) {
  const onApply = vi.fn();
  const view = renderHook(
    (props: { resume: ResumeForm }) => useAiImprove({ resume: props.resume, storageKey: KEY, onApply }),
    { initialProps: { resume } },
  );
  return { ...view, onApply };
}

async function answerAll(result: ReturnType<typeof setup>['result']) {
  act(() => result.current.start());
  await waitFor(() => expect(result.current.step).toBe('questions'));
  act(() => result.current.setUnsentAnswer('Cut render time by 60%'));
  act(() => result.current.answerCurrent('answered'));
  act(() => result.current.answerCurrent('skipped'));
}

describe('useAiImprove', () => {
  beforeEach(() => {
    window.localStorage.clear();
    fetchQuestions.mockReset().mockResolvedValue(QUESTIONS);
    fetchAccountProposal.mockReset().mockResolvedValue({
      account: { profile: { tagline: 'Builds hiring products people trust' } },
      writingVoiceVersion: null,
    });
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('asks the questions, shows the proposal and applies it on Accept', async () => {
    const { result, onApply, unmount } = setup();

    await answerAll(result);
    expect(result.current.step).toBe('answerReview');
    expect(result.current.answers).toEqual([
      { questionId: 'question-1', status: 'answered', value: 'Cut render time by 60%' },
      { questionId: 'question-2', status: 'skipped', value: '' },
    ]);

    act(() => result.current.requestProposal());
    await waitFor(() => expect(result.current.step).toBe('proposalReview'));
    expect(fetchAccountProposal).toHaveBeenCalledWith(
      expect.any(String),
      ['What impact did you deliver?', 'Which tools mattered most?'],
      ['Cut render time by 60%', 'Skipped'],
    );
    expect(result.current.review?.changes).toEqual([
      expect.objectContaining({ section: 'profile', field: 'tagline', after: 'Builds hiring products people trust' }),
    ]);

    act(() => result.current.accept());
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply.mock.calls[0][0].profile.tagline).toBe('Builds hiring products people trust');
    expect(result.current.step).toBe('idle');
    expect(window.localStorage.getItem(KEY)).toBeNull();
    unmount();
  });

  it('leaves the document alone on Reject', async () => {
    const { result, onApply, unmount } = setup();
    await answerAll(result);
    act(() => result.current.requestProposal());
    await waitFor(() => expect(result.current.step).toBe('proposalReview'));

    act(() => result.current.reject());
    expect(onApply).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(KEY)).toBeNull();
    unmount();
  });

  it('reopens a stored session at the same step and drops one for another document', async () => {
    const first = setup();
    act(() => first.result.current.start());
    await waitFor(() => expect(first.result.current.step).toBe('questions'));
    act(() => first.result.current.setUnsentAnswer('Half typed'));
    first.unmount();

    const restored = setup();
    expect(restored.result.current.step).toBe('questions');
    expect(restored.result.current.currentQuestionId).toBe('question-1');
    expect(restored.result.current.unsentAnswer).toBe('Half typed');
    restored.unmount();

    const edited = { ...fullResumeContent, profile: { ...fullResumeContent.profile, role: 'Principal Engineer' } };
    const other = setup(edited);
    expect(other.result.current.step).toBe('idle');
    expect(window.localStorage.getItem(KEY)).toBeNull();
    other.unmount();
  });

  it('reads a stored session once a late storage key arrives', async () => {
    const first = setup();
    act(() => first.result.current.start());
    await waitFor(() => expect(first.result.current.step).toBe('questions'));
    first.unmount();

    const { result, rerender, unmount } = renderHook(
      (props: { storageKey: string | null }) => useAiImprove({
        resume: fullResumeContent,
        storageKey: props.storageKey,
        onApply: vi.fn(),
      }),
      { initialProps: { storageKey: null as string | null } },
    );
    expect(result.current.step).toBe('idle');
    expect(window.localStorage.getItem(KEY)).not.toBeNull();

    rerender({ storageKey: KEY });
    expect(result.current.step).toBe('questions');
    expect(result.current.questions).toHaveLength(2);
    unmount();
  });

  it('drops a proposal that arrives after the document changed', async () => {
    const pending = deferred<{ account: unknown; writingVoiceVersion: null }>();
    fetchAccountProposal.mockReturnValueOnce(pending.promise);
    const { result, rerender, onApply, unmount } = setup();
    await answerAll(result);

    act(() => result.current.requestProposal());
    expect(result.current.step).toBe('loadingProposal');

    const edited = { ...fullResumeContent, profile: { ...fullResumeContent.profile, role: 'Principal Engineer' } };
    rerender({ resume: edited });
    await act(async () => {
      pending.resolve({ account: { profile: { tagline: 'Stale' } }, writingVoiceVersion: null });
      await pending.promise;
    });

    expect(result.current.step).toBe('answerReview');
    expect(result.current.notice).toMatch(/resume changed/);
    expect(result.current.review).toBeNull();
    const stored = JSON.parse(window.localStorage.getItem(KEY) ?? 'null');
    expect(stored).toMatchObject({ proposal: null, proposalFor: documentHash(edited) });
    expect(onApply).not.toHaveBeenCalled();
    unmount();
  });

  it('shows the cap with its reset time and keeps the session on Close', async () => {
    const resetAt = new Date('2026-10-12T00:00:00Z');
    fetchAccountProposal.mockRejectedValueOnce(new AiCapError('Daily AI limit reached.', resetAt));
    const { result, unmount } = setup();
    await answerAll(result);

    act(() => result.current.requestProposal());
    await waitFor(() => expect(result.current.step).toBe('capped'));
    expect(result.current.cap).toEqual({ message: 'Daily AI limit reached.', resetAt });

    act(() => result.current.close());
    expect(result.current.step).toBe('idle');
    act(() => result.current.start());
    expect(result.current.step).toBe('answerReview');
    expect(fetchQuestions).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('recovers from a failed question request with Retry', async () => {
    fetchQuestions.mockRejectedValueOnce(new Error('Failed to fetch questions'));
    const { result, unmount } = setup();

    act(() => result.current.start());
    await waitFor(() => expect(result.current.step).toBe('error'));
    expect(result.current.failure).toEqual({ stage: 'questions', message: 'Failed to fetch questions' });

    act(() => result.current.retry());
    await waitFor(() => expect(result.current.step).toBe('questions'));
    unmount();
  });

  it('goes straight to review when there are no questions', async () => {
    fetchQuestions.mockResolvedValueOnce([]);
    const { result, unmount } = setup();

    act(() => result.current.start());
    await waitFor(() => expect(result.current.step).toBe('answerReview'));
    expect(result.current.questions).toEqual([]);
    unmount();
  });
});
