'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { createLlmClient, type LlmClient } from '@lib/llm/client';
import type { JobRequestBody } from '@lib/llm/contract';
import { createJobRunner, type JobRunner, type JobStorage, type LlmJobState } from '@lib/llm/job-runner';

type UseLlmJobOptions = {
  /** Where the job is remembered across reloads; null keeps it in memory only. */
  storageKey: string | null;
  client?: LlmClient;
  storage?: JobStorage | null;
  /**
   * Called when the job succeeds or fails, from the runner rather than from an effect. `clear`
   * forgets the job; call it after the result is stored.
   */
  onSettled?: (state: Extract<LlmJobState, { phase: 'succeeded' | 'failed' }>, clear: () => void) => void;
};

const IDLE: LlmJobState = { phase: 'idle' };

function localStorageOrNull(): JobStorage | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * One LLM service job for one place in the UI (MDI-221). See lib/llm/job-runner.ts for the rules:
 * stable keys, bounded polling, offline pause, refresh recovery, cancel and retry. A stored job for
 * the key is resumed on mount, so a reload returns to the same job.
 */
export function useLlmJob({ storageKey, client, storage, onSettled }: UseLlmJobOptions) {
  // State is tagged with the key it belongs to, so a new key starts idle instead of showing the
  // previous key's job; resume() then reports a stored job for the new key.
  const [tagged, setTagged] = useState<{ key: string | null; state: LlmJobState }>({
    key: storageKey,
    state: IDLE,
  });
  const state = tagged.key === storageKey ? tagged.state : IDLE;
  const runnerRef = useRef<JobRunner | null>(null);
  const llmClient = useMemo(() => client ?? createLlmClient(), [client]);
  const onSettledRef = useRef(onSettled);

  useEffect(() => {
    onSettledRef.current = onSettled;
  }, [onSettled]);

  useEffect(() => {
    const runner = createJobRunner({
      client: llmClient,
      storage: storageKey ? (storage === undefined ? localStorageOrNull() : storage) : null,
      storageKey: storageKey ?? 'talvio-llm-job:memory',
      onChange: (next) => {
        setTagged({ key: storageKey, state: next });
        if (next.phase === 'succeeded' || next.phase === 'failed') {
          // Cleared after this callback returns, never from inside the runner's own update.
          onSettledRef.current?.(next, () => queueMicrotask(() => runner.clear()));
        }
      },
    });
    runnerRef.current = runner;
    if (storageKey) {
      runner.resume();
    }
    const online = () => runner.online();
    window.addEventListener('online', online);
    return () => {
      window.removeEventListener('online', online);
      runner.dispose();
      if (runnerRef.current === runner) {
        runnerRef.current = null;
      }
    };
  }, [llmClient, storage, storageKey]);

  const start = useCallback((request: JobRequestBody) => runnerRef.current?.start(request), []);
  const cancel = useCallback(() => void runnerRef.current?.cancel(), []);
  const retry = useCallback(() => void runnerRef.current?.retry(), []);
  const clear = useCallback(() => runnerRef.current?.clear(), []);
  /** The request of the current job, also after a reload. */
  const request = useCallback(() => (runnerRef.current?.getRecord()?.request ?? null) as JobRequestBody | null, []);

  return {
    state,
    busy: state.phase === 'submitting' || state.phase === 'running',
    start,
    cancel,
    retry,
    clear,
    request,
  };
}

export type LlmJob = ReturnType<typeof useLlmJob>;
