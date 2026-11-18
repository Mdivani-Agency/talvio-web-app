import { describe, expect, it } from 'vitest';

import { aiImproveStorageKey, resumeDraftStorageKey } from './keys';
import { AI_IMPROVE_SESSION_PREFIX, aiImproveJobStorageKey, clearAiImproveSession } from './ai-improve';

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
  };
}

describe('Improve with AI session storage', () => {
  const key = aiImproveStorageKey(resumeDraftStorageKey({ kind: 'user', userId: 'user-1' }, 'new'));

  it('clears the session and its job, and leaves other keys alone', () => {
    const storage = memoryStorage();
    storage.setItem(`${AI_IMPROVE_SESSION_PREFIX}${key}`, '{"v":1}');
    storage.setItem(aiImproveJobStorageKey(key), '{"jobId":"j"}');
    storage.setItem('other', 'kept');
    clearAiImproveSession(storage, key);
    expect([...storage.map.keys()]).toEqual(['other']);
  });

  it('ignores missing storage', () => {
    expect(() => clearAiImproveSession(null, key)).not.toThrow();
  });
});
