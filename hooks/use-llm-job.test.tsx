import { act, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { LlmClient } from '@lib/llm/client';
import type { JobRequestBody } from '@lib/llm/contract';

import { renderHook } from '../test/utils/render';
import { useLlmJob } from './use-llm-job';

const KEY = 'talvio-llm-job:user-1:import';
const JOB_ID = '7d0c3c1e-1a2b-4c3d-8e4f-5a6b7c8d9e0f';
const REQUEST: JobRequestBody = {
  operation: 'parse_document',
  locale: 'en-US',
  input: { kind: 'text', text: 'Ada Lovelace', extraction: null },
};

const succeeded = {
  jobId: JOB_ID,
  operation: 'parse_document',
  status: 'succeeded',
  stage: 'done',
  sessionId: null,
  contextRevisionId: null,
  deadlineAt: '2026-11-12T10:10:00.000Z',
  pollAfterMs: null,
  result: {
    jobId: JOB_ID,
    operation: 'parse_document',
    contextRevisionId: null,
    contextHash: null,
    sourceRevision: null,
    resultKind: 'complete',
    warnings: [],
    result: {},
  },
  error: null,
};

function client(): LlmClient {
  return {
    createJob: vi.fn(async () => ({ jobId: JOB_ID, status: 'queued', pollAfterMs: 500, replayed: false })),
    getJob: vi.fn(async () => succeeded),
    cancelJob: vi.fn(),
    retryJob: vi.fn(),
  } as unknown as LlmClient;
}

afterEach(() => {
  window.localStorage.clear();
});

describe('useLlmJob', () => {
  it('runs a job to its result', async () => {
    const llm = client();
    const { result } = renderHook(() => useLlmJob({ storageKey: KEY, client: llm }));
    act(() => result.current.start(REQUEST));
    expect(result.current.busy).toBe(true);
    await waitFor(() => expect(result.current.state.phase).toBe('succeeded'));
    expect(result.current.busy).toBe(false);
  });

  it('picks up the stored job when the page loads again', async () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ v: 1, clientRequestId: 'key-stored-1', request: REQUEST, jobId: JOB_ID, submittedAt: '2026-11-12T10:00:00.000Z' }),
    );
    const llm = client();
    const { result } = renderHook(() => useLlmJob({ storageKey: KEY, client: llm }));
    await waitFor(() => expect(result.current.state.phase).toBe('succeeded'));
    expect(llm.createJob).not.toHaveBeenCalled();
    expect(llm.getJob).toHaveBeenCalledWith(JOB_ID);
  });

  it('stays idle without a stored job', () => {
    const llm = client();
    const { result } = renderHook(() => useLlmJob({ storageKey: KEY, client: llm }));
    expect(result.current.state).toEqual({ phase: 'idle' });
    expect(llm.getJob).not.toHaveBeenCalled();
  });
});
