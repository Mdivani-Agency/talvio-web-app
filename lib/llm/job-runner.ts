import { z } from 'zod';

import type { LlmClient } from './client';
import { jobRequest } from './client';
import { isTerminal, type Job, type JobRequestBody, type ResultEnvelope } from './contract';
import { errorFromJob, LlmError, LlmNetworkError, UNAVAILABLE_MESSAGE } from './errors';

/*
 * Runs one LLM service job for one place in the UI (MDI-221), without React so it can be tested
 * with fake timers. `useLlmJob` wraps it.
 *
 * - Stable submission: the request and its clientRequestId are stored before the first send. A
 *   submit that gets no answer is sent again with the same key, so the service returns the job it
 *   already admitted instead of starting a second one.
 * - Refresh recovery: the stored job id brings a reloaded page back to the same job, and a
 *   finished job's result stays available until the feature calls `clear()`.
 * - Bounded polling: the service's pollAfterMs (clamped), backoff on network errors, a pause while
 *   offline, a cap on polls, and a stop shortly after the job's deadline.
 * - Cancel and retry: a retryable job error is retried in place; anything else starts over with a
 *   new key.
 */

export const MIN_POLL_MS = 500;
export const MAX_POLL_MS = 30_000;
/** How long after the job's deadline the runner keeps asking before it gives up. */
export const DEADLINE_GRACE_MS = 60_000;
/** Upper bound on polls for one job, far above what a 10-minute deadline needs. */
export const MAX_POLLS = 400;
/** Automatic resubmissions with the same key after a submit got no answer. */
export const MAX_SUBMIT_ATTEMPTS = 3;
const SUBMIT_BACKOFF_MS = 2_000;

export type JobStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const storedJobSchema = z.object({
  v: z.literal(1),
  clientRequestId: z.string().min(8).max(128),
  request: z.looseObject({ operation: z.string(), locale: z.string(), input: z.unknown() }),
  jobId: z.string().nullable(),
  submittedAt: z.string(),
});
export type StoredJob = z.infer<typeof storedJobSchema>;

export type LlmJobState =
  | { phase: 'idle' }
  | { phase: 'submitting'; offline: boolean }
  | { phase: 'running'; jobId: string; status: string; stage: string; offline: boolean }
  | { phase: 'succeeded'; jobId: string; job: Job; result: ResultEnvelope }
  | { phase: 'failed'; jobId: string | null; error: LlmError }
  | { phase: 'cancelled'; jobId: string | null };

export type JobRunnerOptions = {
  client: LlmClient;
  storage: JobStorage | null;
  storageKey: string;
  onChange: (state: LlmJobState) => void;
  newKey?: () => string;
  now?: () => number;
  isOnline?: () => boolean;
};

export function readStoredJob(storage: JobStorage | null, key: string): StoredJob | null {
  if (!storage) {
    return null;
  }
  try {
    const raw = storage.getItem(key);
    if (!raw) {
      return null;
    }
    const parsed = storedJobSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      storage.removeItem(key);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export function createJobRunner(options: JobRunnerOptions) {
  const { client, storage, storageKey, onChange } = options;
  const newKey = options.newKey ?? (() => crypto.randomUUID());
  const now = options.now ?? (() => Date.now());
  const isOnline = options.isOnline ?? (() => typeof navigator === 'undefined' || navigator.onLine !== false);

  let state: LlmJobState = { phase: 'idle' };
  let record: StoredJob | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  /** Bumped by every new action, so answers to an older action are ignored. */
  let generation = 0;
  let polls = 0;
  let pollDelay = MIN_POLL_MS;
  let deadline: number | null = null;
  let waitingForOnline: (() => void) | null = null;
  let cancelWhenAccepted = false;
  /** The last request started or resumed, to start again after a refusal. */
  let lastRequest: JobRequestBody | null = null;

  const set = (next: LlmJobState) => {
    state = next;
    onChange(next);
  };

  const save = (next: StoredJob | null) => {
    record = next;
    if (!storage) {
      return;
    }
    try {
      if (next) {
        storage.setItem(storageKey, JSON.stringify(next));
      } else {
        storage.removeItem(storageKey);
      }
    } catch {
      // Storage is a convenience: without it the job still runs, but a reload loses it.
    }
  };

  const stopTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    waitingForOnline = null;
  };

  const later = (run: () => void, ms: number) => {
    stopTimer();
    timer = setTimeout(() => {
      timer = null;
      if (!isOnline()) {
        // Paused while offline; `online()` continues it.
        waitingForOnline = run;
        markOffline(true);
        return;
      }
      run();
    }, ms);
  };

  const markOffline = (offline: boolean) => {
    if (state.phase === 'submitting' || state.phase === 'running') {
      if (state.offline !== offline) {
        set({ ...state, offline });
      }
    }
  };

  const fail = (error: LlmError, jobId: string | null) => {
    stopTimer();
    set({ phase: 'failed', jobId, error });
  };

  const finish = (job: Job) => {
    stopTimer();
    if (job.status === 'succeeded' && job.result) {
      set({ phase: 'succeeded', jobId: job.jobId, job, result: job.result });
      return;
    }
    if (job.status === 'cancelled') {
      save(null);
      set({ phase: 'cancelled', jobId: job.jobId });
      return;
    }
    const error = job.error
      ? errorFromJob(job.error)
      : new LlmError({ code: job.status === 'expired' ? 'deadline_exceeded' : 'internal_error', message: UNAVAILABLE_MESSAGE });
    fail(error, job.jobId);
  };

  const poll = async (gen: number, jobId: string) => {
    if (gen !== generation) {
      return;
    }
    if (polls >= MAX_POLLS || (deadline !== null && now() > deadline + DEADLINE_GRACE_MS)) {
      fail(new LlmError({ code: 'deadline_exceeded', message: 'This is taking too long. Try again.' }), jobId);
      return;
    }
    polls += 1;
    let job: Job;
    try {
      job = await client.getJob(jobId);
    } catch (error) {
      if (gen !== generation) {
        return;
      }
      if (error instanceof LlmNetworkError || (error instanceof LlmError && error.retryable)) {
        pollDelay = Math.min(MAX_POLL_MS, Math.max(pollDelay * 2, 2_000));
        markOffline(!isOnline());
        later(() => void poll(gen, jobId), pollDelay);
        return;
      }
      const failure = error instanceof LlmError ? error : new LlmError({ code: 'internal_error', message: UNAVAILABLE_MESSAGE });
      if (failure.code === 'not_found') {
        // Expired or deleted on the service: nothing to come back to.
        save(null);
      }
      fail(failure, jobId);
      return;
    }
    if (gen !== generation) {
      return;
    }
    deadline = Date.parse(job.deadlineAt) || deadline;
    if (isTerminal(job.status)) {
      finish(job);
      return;
    }
    set({ phase: 'running', jobId, status: job.status, stage: job.stage, offline: false });
    pollDelay = clampPoll(job.pollAfterMs);
    later(() => void poll(gen, jobId), pollDelay);
  };

  const track = (gen: number, jobId: string, delay: number) => {
    polls = 0;
    pollDelay = clampPoll(delay);
    set({ phase: 'running', jobId, status: 'queued', stage: 'admission', offline: false });
    later(() => void poll(gen, jobId), pollDelay);
  };

  const submit = async (gen: number, attempt: number) => {
    if (!record) {
      return;
    }
    const current = record;
    set({ phase: 'submitting', offline: !isOnline() });
    try {
      const accepted = await client.createJob(
        jobRequest(current.request as JobRequestBody, current.clientRequestId),
      );
      if (gen !== generation) {
        if (cancelWhenAccepted) {
          cancelWhenAccepted = false;
          void client.cancelJob(accepted.jobId).catch(() => undefined);
        }
        return;
      }
      save({ ...current, jobId: accepted.jobId });
      track(gen, accepted.jobId, accepted.pollAfterMs);
    } catch (error) {
      if (gen !== generation) {
        return;
      }
      if (error instanceof LlmNetworkError || (error instanceof LlmError && error.code === 'dependency_unavailable')) {
        if (attempt < MAX_SUBMIT_ATTEMPTS) {
          // Same key: if the first send was admitted, the service answers with that job.
          later(() => void submit(gen, attempt + 1), SUBMIT_BACKOFF_MS * 2 ** (attempt - 1));
          return;
        }
        fail(error as LlmError, null);
        return;
      }
      // Refused (validation, quota, sign-in): the stored request will not succeed as it is,
      // except after sign-in, when the same key is still the right one to send.
      const failure = error instanceof LlmError ? error : new LlmError({ code: 'internal_error', message: UNAVAILABLE_MESSAGE });
      if (failure.code !== 'unauthorized') {
        save(null);
      }
      fail(failure, null);
    }
  };

  return {
    getState: () => state,
    getRecord: () => record,

    /** Starts a new job for this request, or rejoins the stored one if it is for the same request. */
    start(request: JobRequestBody) {
      const stored = readStoredJob(storage, storageKey);
      if (stored && sameRequest(stored.request, request)) {
        this.resume();
        return;
      }
      if (state.phase === 'running') {
        // A different request replaces this one; the old job's result would never be used.
        void client.cancelJob(state.jobId).catch(() => undefined);
      }
      generation += 1;
      stopTimer();
      deadline = null;
      lastRequest = request;
      save({ v: 1, clientRequestId: newKey(), request: request as StoredJob['request'], jobId: null, submittedAt: new Date(now()).toISOString() });
      void submit(generation, 1);
    },

    /** Continues the stored job after a reload: polls it, or sends its submission again. Returns false when there is none. */
    resume(): boolean {
      const stored = readStoredJob(storage, storageKey);
      if (!stored) {
        return false;
      }
      generation += 1;
      stopTimer();
      deadline = null;
      record = stored;
      lastRequest = stored.request as JobRequestBody;
      if (stored.jobId) {
        polls = 0;
        set({ phase: 'running', jobId: stored.jobId, status: 'queued', stage: 'admission', offline: !isOnline() });
        void poll(generation, stored.jobId);
      } else {
        void submit(generation, 1);
      }
      return true;
    },

    async cancel() {
      const jobId = record?.jobId ?? null;
      const wasSubmitting = state.phase === 'submitting';
      generation += 1;
      stopTimer();
      save(null);
      set({ phase: 'cancelled', jobId });
      if (jobId) {
        try {
          await client.cancelJob(jobId);
        } catch {
          // Best effort: a job that cannot be cancelled ends at its deadline and is not shown.
        }
      } else if (wasSubmitting) {
        cancelWhenAccepted = true;
      }
    },

    /** Retries a failed job in place when the service allows it, otherwise starts the request again. */
    async retry() {
      if (state.phase !== 'failed') {
        return;
      }
      const { error, jobId } = state;
      if (!record) {
        // The service refused the request as it was; send it again as a new request.
        if (lastRequest) {
          this.start(lastRequest);
        }
        return;
      }
      generation += 1;
      const gen = generation;
      stopTimer();
      if (!jobId) {
        // The submission never got an answer, or needed sign-in: send it again with the same key.
        void submit(gen, 1);
        return;
      }
      if (error.retryable && error.code !== 'network_error') {
        set({ phase: 'submitting', offline: !isOnline() });
        try {
          const accepted = await client.retryJob(jobId);
          if (gen === generation) {
            track(gen, accepted.jobId, accepted.pollAfterMs);
          }
          return;
        } catch (retryError) {
          if (gen !== generation) {
            return;
          }
          if (retryError instanceof LlmNetworkError || (retryError instanceof LlmError && (retryError.status ?? 0) >= 500)) {
            // The retry may have been accepted with the answer lost: follow the same job rather than
            // submitting a second one. If it is still failed, Retry is offered again.
            polls = 0;
            set({ phase: 'running', jobId, status: 'queued', stage: 'admission', offline: !isOnline() });
            void poll(gen, jobId);
            return;
          }
        }
      } else if (error.code === 'network_error' || error.code === 'unauthorized') {
        polls = 0;
        set({ phase: 'running', jobId, status: 'queued', stage: 'admission', offline: !isOnline() });
        void poll(gen, jobId);
        return;
      }
      const request = record.request as JobRequestBody;
      save(null);
      this.start(request);
    },

    /** Forgets the job, for example once its result has been used. */
    clear() {
      generation += 1;
      stopTimer();
      save(null);
      set({ phase: 'idle' });
    },

    /** Call when the browser comes back online. */
    online() {
      const run = waitingForOnline;
      if (run) {
        waitingForOnline = null;
        markOffline(false);
        run();
      }
    },

    /** Stops timers without touching storage, for unmount. */
    dispose() {
      generation += 1;
      stopTimer();
    },
  };
}

export type JobRunner = ReturnType<typeof createJobRunner>;

export function clampPoll(ms: number | null | undefined): number {
  if (typeof ms !== 'number' || !Number.isFinite(ms)) {
    return MIN_POLL_MS * 4;
  }
  return Math.min(MAX_POLL_MS, Math.max(MIN_POLL_MS, ms));
}

function sameRequest(a: unknown, b: unknown): boolean {
  return stableJson(a) === stableJson(b);
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}
