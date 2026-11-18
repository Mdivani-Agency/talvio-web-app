import type { DraftStorage } from './storage';

/** Where `useServiceImprove` keeps an Improve with AI session for one resume (under `aiImproveStorageKey`). */
export const AI_IMPROVE_SESSION_PREFIX = 'talvio-llm-improve:v1:';

/** Where that session's running LLM job is kept. */
export function aiImproveJobStorageKey(key: string) {
  return `talvio-llm-job:v1:improve:${key}`;
}

/**
 * Forgets the Improve with AI session of one resume draft and its running job. Storage failures are
 * ignored: the session is a convenience. The service deletes the session itself after seven days.
 */
export function clearAiImproveSession(storage: DraftStorage | null, key: string) {
  if (!storage) {
    return;
  }
  try {
    storage.removeItem(`${AI_IMPROVE_SESSION_PREFIX}${key}`);
    storage.removeItem(aiImproveJobStorageKey(key));
  } catch {
    // Private mode: nothing was stored.
  }
}
