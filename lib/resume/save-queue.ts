import type { ResumeContentPatch } from '@/lib/adapters/resume.adapter';

export type SaveStatus =
  | 'saved-locally'
  | 'saving'
  | 'saved'
  | 'generating'
  | 'failed'
  | 'conflict';

export const SAVE_STATUS_LABEL: Record<SaveStatus, string> = {
  'saved-locally': 'Saved locally',
  saving: 'Saving',
  saved: 'Saved to account',
  generating: 'Generating',
  failed: 'Failed',
  conflict: 'Conflict',
};

export type SaveQueueState<T> = {
  status: SaveStatus;
  serverId?: string;
  baseUpdatedAt?: string;
  inflight?: T;
  pending?: T;
  error?: string;
};

export type SavedRevision = {
  serverId: string;
  baseUpdatedAt: string;
};

export function mergeResumePatch(
  current: ResumeContentPatch | undefined,
  next: ResumeContentPatch | undefined,
): ResumeContentPatch {
  const merged: ResumeContentPatch = { ...(current ?? {}) };
  if (!next) {
    return merged;
  }
  for (const [key, value] of Object.entries(next)) {
    if (value !== undefined) {
      (merged as Record<string, unknown>)[key] = value;
    }
  }
  return merged;
}

export function createSaveQueue<T>(merge: (current: T | undefined, next: T | undefined) => T) {
  let state: SaveQueueState<T> = { status: 'saved-locally' };
  const listeners = new Set<() => void>();

  const publish = (next: SaveQueueState<T>) => {
    state = next;
    listeners.forEach((listener) => listener());
  };

  return {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    seed(server: SavedRevision, markSaved = false) {
      if (state.serverId || state.inflight) {
        return;
      }
      publish({
        ...state,
        serverId: server.serverId,
        baseUpdatedAt: server.baseUpdatedAt,
        status: markSaved && state.status === 'saved-locally' ? 'saved' : state.status,
      });
    },
    begin(patch: T): 'started' | 'queued' {
      if (state.status === 'conflict' || state.status === 'generating' || state.inflight) {
        publish({
          ...state,
          pending: merge(state.pending, patch),
        });
        return 'queued';
      }
      publish({
        ...state,
        status: 'saving',
        inflight: patch,
        error: undefined,
      });
      return 'started';
    },
    succeed(server: SavedRevision): T | undefined {
      const pending = state.pending;
      publish({
        status: pending ? 'saving' : 'saved',
        serverId: server.serverId,
        baseUpdatedAt: server.baseUpdatedAt,
        inflight: pending,
        pending: undefined,
      });
      return pending;
    },
    fail(kind: 'conflict' | 'failed', message?: string) {
      publish({
        status: kind === 'conflict' ? 'conflict' : 'failed',
        serverId: state.serverId,
        baseUpdatedAt: state.baseUpdatedAt,
        pending: state.inflight ? merge(state.pending, state.inflight) : state.pending,
        error: message,
      });
    },
    rebase(baseUpdatedAt: string) {
      publish({ ...state, baseUpdatedAt });
    },
    retry(): T | undefined {
      if (state.inflight) {
        return undefined;
      }
      if ((state.status !== 'failed' && state.status !== 'conflict') || !state.pending) {
        return undefined;
      }
      const patch = state.pending;
      publish({
        ...state,
        status: 'saving',
        inflight: patch,
        pending: undefined,
        error: undefined,
      });
      return patch;
    },
    markGenerating() {
      if (state.inflight) {
        return;
      }
      publish({ ...state, status: 'generating', error: undefined });
    },
    finishGenerating(ok: boolean, message?: string): T | undefined {
      if (!ok) {
        publish({
          ...state,
          status: 'failed',
          inflight: undefined,
          error: message ?? state.error ?? 'Failed to generate PDF',
        });
        return undefined;
      }
      if (state.pending) {
        const patch = state.pending;
        publish({
          ...state,
          status: 'saving',
          inflight: patch,
          pending: undefined,
          error: undefined,
        });
        return patch;
      }
      publish({
        ...state,
        status: 'saved',
        inflight: undefined,
        error: undefined,
      });
      return undefined;
    },
  };
}

type SaveContext = {
  serverId?: string;
  baseUpdatedAt?: string;
};

export function createSaveRunner<T>(options: {
  merge: (current: T | undefined, next: T | undefined) => T;
  save: (patch: T, context: SaveContext) => Promise<SavedRevision>;
  isConflict: (error: unknown) => boolean;
  onConflict?: (serverId?: string) => Promise<string | undefined>;
}) {
  const queue = createSaveQueue(options.merge);
  let running = false;
  let resumeRequested = false;
  const idleWaiters: Array<{ resolve: () => void; reject: (error: Error) => void }> = [];

  const notifyWaiters = () => {
    const state = queue.getState();
    if (state.inflight || state.status === 'saving') {
      return;
    }
    const waiters = idleWaiters.splice(0);
    if (state.status === 'failed' || state.status === 'conflict') {
      const error = new Error(state.error ?? 'Failed to save resume');
      waiters.forEach((waiter) => waiter.reject(error));
      return;
    }
    waiters.forEach((waiter) => waiter.resolve());
  };

  async function pump() {
    if (running) {
      resumeRequested = true;
      return;
    }
    running = true;
    try {
      do {
        resumeRequested = false;
        while (queue.getState().inflight && queue.getState().status === 'saving') {
          const patch = queue.getState().inflight as T;
          const { serverId, baseUpdatedAt } = queue.getState();
          try {
            const saved = await options.save(patch, { serverId, baseUpdatedAt });
            queue.succeed(saved);
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to save resume';
            if (options.isConflict(error)) {
              queue.fail('conflict', message);
              try {
                const base = await options.onConflict?.(queue.getState().serverId);
                if (base && queue.getState().status === 'conflict') {
                  queue.rebase(base);
                }
              } catch {
                // Keep the previous revision. The next retry conflicts again.
              }
            } else {
              queue.fail('failed', message);
            }
            break;
          }
        }
      } while (
        resumeRequested
        && queue.getState().inflight
        && queue.getState().status === 'saving'
      );
    } finally {
      running = false;
      if (
        resumeRequested
        && queue.getState().inflight
        && queue.getState().status === 'saving'
      ) {
        void pump();
        return;
      }
      notifyWaiters();
    }
  }

  return {
    getState: queue.getState,
    subscribe: queue.subscribe,
    seed: queue.seed,
    enqueue(patch: T) {
      const decision = queue.begin(patch);
      if (decision === 'started') {
        void pump();
      }
    },
    async retry() {
      if (queue.getState().status === 'conflict') {
        try {
          const base = await options.onConflict?.(queue.getState().serverId);
          if (base) {
            queue.rebase(base);
          }
        } catch {
          // Retry with the stored revision.
        }
      }
      const patch = queue.retry();
      if (patch) {
        await pump();
      }
    },
    whenIdle() {
      const state = queue.getState();
      if (!state.inflight && state.status !== 'saving') {
        if (state.status === 'failed' || state.status === 'conflict') {
          return Promise.reject(new Error(state.error ?? 'Failed to save resume'));
        }
        return Promise.resolve();
      }
      return new Promise<void>((resolve, reject) => {
        idleWaiters.push({ resolve, reject });
      });
    },
    beginGenerating() {
      queue.markGenerating();
    },
    async finishGenerating(ok: boolean, message?: string) {
      const next = queue.finishGenerating(ok, message);
      if (next) {
        await pump();
      }
    },
  };
}
