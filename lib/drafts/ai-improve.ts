import { aiImproveSessionSchema, type AiImproveSession } from './schema';
import type { DraftStorage } from './storage';

/** The stored session, or null when there is none, it is invalid, or it was made for another document. */
export function readAiImproveSession(
  storage: DraftStorage | null,
  key: string,
  documentHash: string,
): AiImproveSession | null {
  if (!storage) {
    return null;
  }
  try {
    const raw = storage.getItem(key);
    if (!raw) {
      return null;
    }
    const parsed = aiImproveSessionSchema.safeParse(JSON.parse(raw));
    if (!parsed.success || parsed.data.proposalFor !== documentHash) {
      storage.removeItem(key);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

/** Writes the session, or removes it for null. Storage failures are ignored: the session is a convenience. */
export function writeAiImproveSession(storage: DraftStorage | null, key: string, session: AiImproveSession | null) {
  if (!storage) {
    return;
  }
  try {
    if (!session) {
      storage.removeItem(key);
      return;
    }
    storage.setItem(key, JSON.stringify(aiImproveSessionSchema.parse(session)));
  } catch {
    // Quota or private mode: the session only lives in memory.
  }
}
