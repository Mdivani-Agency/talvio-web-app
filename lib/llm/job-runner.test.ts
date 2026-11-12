import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { LlmClient } from './client';
import type { Job, JobRequestBody } from './contract';
import { LlmError, LlmNetworkError } from './errors';
import { createJobRunner, DEADLINE_GRACE_MS, readStoredJob, type LlmJobState } from './job-runner';

const KEY = 'talvio-llm-job:test';
const JOB_ID = '7d0c3c1e-1a2b-4c3d-8e4f-5a6b7c8d9e0f';
const T0 = Date.parse('2026-11-12T10:00:00Z');

const REQUEST: JobRequestBody = {
  operation: 'parse_document',
  locale: 'en-US',
  input: { kind: 'text', text: 'Ada Lovelace, engineer', extraction: null },
};

function memoryStorage() {
  const items = new Map<string, string>();
  return {
    items,
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    removeItem: (key: string) => void items.delete(key),
  };
}

function job(status: string, patch: Partial<Job> = {}): Job {
  return {
    jobId: JOB_ID,
    operation: 'parse_document',
    status,
    stage: status === 'succeeded' ? 'done' : 'inference',
    sessionId: null,
    contextRevisionId: null,
    deadlineAt: new Date(T0 + 600_000).toISOString(),
    pollAfterMs: status === 'succeeded' ? null : 1_000,
    result:
      status === 'succeeded'
        ? {
            jobId: JOB_ID,
            operation: 'parse_document',
            contextRevisionId: null,
            contextHash: null,
            sourceRevision: null,
            resultKind: 'complete',
            warnings: [],
            result: { career: {} },
          }
        : null,
    error: null,
    ...patch,
  };
}

const accepted = (patch = {}) => ({ jobId: JOB_ID, status: 'queued', pollAfterMs: 1_000, replayed: false, ...patch });

function fakeClient() {
  return {
    createJob: vi.fn(),
    getJob: vi.fn(),
    cancelJob: vi.fn(async () => job('cancelled')),
    retryJob: vi.fn(),
  } satisfies Record<keyof LlmClient, unknown>;
}

function setup(options: { online?: () => boolean; storage?: ReturnType<typeof memoryStorage> } = {}) {
  const client = fakeClient();
  const storage = options.storage ?? memoryStorage();
  const states: LlmJobState[] = [];
  let n = 0;
  const runner = createJobRunner({
    client: client as unknown as LlmClient,
    storage,
    storageKey: KEY,
    onChange: (state) => states.push(state),
    newKey: () => `key-0000000${++n}`,
    now: () => Date.now(),
    isOnline: options.online,
  });
  return { client, storage, runner, states, last: () => states.at(-1)! };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(T0);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('job runner', () => {
  it('submits, polls at the service pace and keeps the result until cleared', async () => {
    const { client, runner, storage, last } = setup();
    client.createJob.mockResolvedValue(accepted());
    client.getJob.mockResolvedValueOnce(job('running')).mockResolvedValueOnce(job('succeeded'));

    runner.start(REQUEST);
    await vi.advanceTimersByTimeAsync(0);
    expect(last()).toMatchObject({ phase: 'running', jobId: JOB_ID });
    expect(client.createJob.mock.calls[0]![0]).toMatchObject({ clientRequestId: 'key-00000001', schemaVersion: '1.0' });

    await vi.advanceTimersByTimeAsync(999);
    expect(client.getJob).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(last()).toMatchObject({ phase: 'running', status: 'running', stage: 'inference' });
    await vi.advanceTimersByTimeAsync(1_000);
    expect(last()).toMatchObject({ phase: 'succeeded', jobId: JOB_ID, result: { result: { career: {} } } });
    expect(readStoredJob(storage, KEY)).toMatchObject({ jobId: JOB_ID });

    runner.clear();
    expect(readStoredJob(storage, KEY)).toBeNull();
    expect(last()).toEqual({ phase: 'idle' });
  });

  it('sends a submit that got no answer again with the same key', async () => {
    const { client, runner } = setup();
    client.createJob
      .mockRejectedValueOnce(new LlmNetworkError())
      .mockResolvedValueOnce(accepted({ replayed: true }));
    client.getJob.mockResolvedValue(job('running'));

    runner.start(REQUEST);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(client.createJob).toHaveBeenCalledTimes(2);
    const keys = client.createJob.mock.calls.map((call) => (call[0] as { clientRequestId: string }).clientRequestId);
    expect(keys).toEqual(['key-00000001', 'key-00000001']);
    expect(runner.getState()).toMatchObject({ phase: 'running', jobId: JOB_ID });
  });

  it('gives up after bounded resubmissions and keeps the key for a manual retry', async () => {
    const { client, runner, last } = setup();
    client.createJob.mockRejectedValue(new LlmNetworkError());
    runner.start(REQUEST);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(client.createJob).toHaveBeenCalledTimes(3);
    expect(last()).toMatchObject({ phase: 'failed', jobId: null, error: { code: 'network_error' } });

    client.createJob.mockResolvedValueOnce(accepted({ replayed: true }));
    client.getJob.mockResolvedValue(job('running'));
    await runner.retry();
    await vi.advanceTimersByTimeAsync(0);
    expect((client.createJob.mock.calls[3]![0] as { clientRequestId: string }).clientRequestId).toBe('key-00000001');
    expect(last()).toMatchObject({ phase: 'running' });
  });

  it('returns to the same job after a reload', async () => {
    const storage = memoryStorage();
    const first = setup({ storage });
    first.client.createJob.mockResolvedValue(accepted());
    first.runner.start(REQUEST);
    await vi.advanceTimersByTimeAsync(0);
    first.runner.dispose();

    const second = setup({ storage });
    second.client.getJob.mockResolvedValue(job('succeeded'));
    expect(second.runner.resume()).toBe(true);
    await vi.advanceTimersByTimeAsync(0);
    expect(second.client.createJob).not.toHaveBeenCalled();
    expect(second.client.getJob).toHaveBeenCalledWith(JOB_ID);
    expect(second.last()).toMatchObject({ phase: 'succeeded' });

    // Starting the same request again rejoins the stored job instead of paying for a new one.
    second.runner.start(REQUEST);
    await vi.advanceTimersByTimeAsync(0);
    expect(second.client.createJob).not.toHaveBeenCalled();
  });

  it('resends a stored submission that never got a job id with its original key', async () => {
    const storage = memoryStorage();
    storage.setItem(
      KEY,
      JSON.stringify({ v: 1, clientRequestId: 'key-stored-1', request: REQUEST, jobId: null, submittedAt: new Date(T0).toISOString() }),
    );
    const { client, runner } = setup({ storage });
    client.createJob.mockResolvedValue(accepted({ replayed: true }));
    client.getJob.mockResolvedValue(job('running'));
    runner.resume();
    await vi.advanceTimersByTimeAsync(0);
    expect((client.createJob.mock.calls[0]![0] as { clientRequestId: string }).clientRequestId).toBe('key-stored-1');
  });

  it('backs off on network errors while polling and pauses while offline', async () => {
    let online = true;
    const { client, runner, last } = setup({ online: () => online });
    client.createJob.mockResolvedValue(accepted());
    client.getJob.mockRejectedValueOnce(new LlmNetworkError()).mockResolvedValue(job('running'));
    runner.start(REQUEST);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(client.getJob).toHaveBeenCalledTimes(1);

    online = false;
    await vi.advanceTimersByTimeAsync(10_000);
    expect(client.getJob).toHaveBeenCalledTimes(1);
    expect(last()).toMatchObject({ phase: 'running', offline: true });

    online = true;
    runner.online();
    await vi.advanceTimersByTimeAsync(0);
    expect(client.getJob).toHaveBeenCalledTimes(2);
    expect(last()).toMatchObject({ phase: 'running', offline: false });
  });

  it('stops after the deadline instead of polling forever', async () => {
    const { client, runner, last } = setup();
    client.createJob.mockResolvedValue(accepted());
    client.getJob.mockResolvedValue(job('running', { pollAfterMs: 30_000 }));
    runner.start(REQUEST);
    await vi.advanceTimersByTimeAsync(600_000 + DEADLINE_GRACE_MS + 60_000);
    expect(last()).toMatchObject({ phase: 'failed', error: { code: 'deadline_exceeded' } });
    const calls = client.getJob.mock.calls.length;
    await vi.advanceTimersByTimeAsync(120_000);
    expect(client.getJob.mock.calls.length).toBe(calls);
  });

  it('retries a retryable job error in place and starts over after any other', async () => {
    const { client, runner, last } = setup();
    client.createJob.mockResolvedValue(accepted());
    const failed = (code: string, retryable: boolean) =>
      job('failed', { pollAfterMs: null, error: { code, message: 'Failed.', retryable, correlationId: 'c' } });
    client.getJob.mockResolvedValueOnce(failed('dependency_unavailable', true));
    runner.start(REQUEST);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(last()).toMatchObject({ phase: 'failed', error: { code: 'dependency_unavailable', retryable: true } });

    client.retryJob.mockResolvedValue(accepted());
    client.getJob.mockResolvedValueOnce(failed('model_refusal', false));
    await runner.retry();
    expect(client.retryJob).toHaveBeenCalledWith(JOB_ID);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(last()).toMatchObject({ phase: 'failed', error: { code: 'model_refusal' } });

    client.getJob.mockResolvedValue(job('running'));
    await runner.retry();
    await vi.advanceTimersByTimeAsync(0);
    expect(client.createJob).toHaveBeenCalledTimes(2);
    expect((client.createJob.mock.calls[1]![0] as { clientRequestId: string }).clientRequestId).toBe('key-00000002');
  });

  it('follows the same job when the retry answer is lost', async () => {
    const { client, runner, last } = setup();
    client.createJob.mockResolvedValue(accepted());
    client.getJob.mockResolvedValueOnce(
      job('failed', {
        pollAfterMs: null,
        error: { code: 'dependency_unavailable', message: 'Failed.', retryable: true, correlationId: 'c' },
      }),
    );
    runner.start(REQUEST);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(last()).toMatchObject({ phase: 'failed' });

    client.retryJob.mockRejectedValueOnce(new LlmNetworkError());
    client.getJob.mockResolvedValue(job('succeeded'));
    await runner.retry();
    await vi.advanceTimersByTimeAsync(0);
    expect(client.createJob).toHaveBeenCalledTimes(1);
    expect(client.getJob).toHaveBeenLastCalledWith(JOB_ID);
    expect(last()).toMatchObject({ phase: 'succeeded' });
  });

  it('forgets a request the service refused and starts it fresh on retry', async () => {
    const { client, runner, storage, last } = setup();
    client.createJob.mockRejectedValueOnce(
      new LlmError({ code: 'quota_exceeded', message: 'Limit reached.', status: 429 }),
    );
    runner.start(REQUEST);
    await vi.advanceTimersByTimeAsync(0);
    expect(last()).toMatchObject({ phase: 'failed', error: { uiState: 'capped' } });
    expect(readStoredJob(storage, KEY)).toBeNull();
  });

  it('cancels a running job and forgets it', async () => {
    const { client, runner, storage, last } = setup();
    client.createJob.mockResolvedValue(accepted());
    client.getJob.mockResolvedValue(job('running'));
    runner.start(REQUEST);
    await vi.advanceTimersByTimeAsync(0);
    await runner.cancel();
    expect(client.cancelJob).toHaveBeenCalledWith(JOB_ID);
    expect(last()).toEqual({ phase: 'cancelled', jobId: JOB_ID });
    expect(readStoredJob(storage, KEY)).toBeNull();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(client.getJob).not.toHaveBeenCalled();
  });

  it('cancels a job that is admitted after the user cancelled its submission', async () => {
    const { client, runner } = setup();
    let admit!: (value: unknown) => void;
    client.createJob.mockReturnValue(new Promise((resolve) => (admit = resolve)));
    runner.start(REQUEST);
    await vi.advanceTimersByTimeAsync(0);
    await runner.cancel();
    admit(accepted());
    await vi.advanceTimersByTimeAsync(0);
    expect(client.cancelJob).toHaveBeenCalledWith(JOB_ID);
    expect(client.getJob).not.toHaveBeenCalled();
  });

  it('treats a job the service no longer has as expired', async () => {
    const { client, runner, storage, last } = setup();
    client.createJob.mockResolvedValue(accepted());
    client.getJob.mockRejectedValue(new LlmError({ code: 'not_found', message: 'Not found.', status: 404 }));
    runner.start(REQUEST);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(last()).toMatchObject({ phase: 'failed', error: { uiState: 'expired' } });
    expect(readStoredJob(storage, KEY)).toBeNull();
  });
});
