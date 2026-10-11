import { describe, expect, it } from 'vitest';

import { aiImproveStorageKey, resumeDraftStorageKey } from './keys';
import { readAiImproveSession, writeAiImproveSession } from './ai-improve';
import type { AiImproveSession } from './schema';

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
  };
}

const session: AiImproveSession = {
  questions: [{ id: 'question-1', question: 'What changed?', example: 'Cut costs' }],
  answers: [{ questionId: 'question-1', status: 'answered', value: 'Cut render time' }],
  currentQuestionId: null,
  unsentAnswer: '',
  proposal: null,
  proposalFor: 'abc12345',
};

describe('Improve with AI session storage', () => {
  const key = aiImproveStorageKey(resumeDraftStorageKey({ kind: 'user', userId: 'user-1' }, 'new'));

  it('keys the session next to the resume draft', () => {
    expect(key).toBe('talvio-draft-v1:resume:user:user-1:new:ai-improve');
  });

  it('round-trips a session for the same document', () => {
    const storage = memoryStorage();
    writeAiImproveSession(storage, key, session);
    expect(readAiImproveSession(storage, key, 'abc12345')).toEqual(session);
  });

  it('drops a session made for another document or stored in a bad shape', () => {
    const storage = memoryStorage();
    writeAiImproveSession(storage, key, session);
    expect(readAiImproveSession(storage, key, 'different')).toBeNull();
    expect(storage.map.has(key)).toBe(false);

    storage.setItem(key, JSON.stringify({ questions: 'nope' }));
    expect(readAiImproveSession(storage, key, 'abc12345')).toBeNull();
    expect(storage.map.has(key)).toBe(false);
  });

  it('clears the session on null and tolerates missing storage', () => {
    const storage = memoryStorage();
    writeAiImproveSession(storage, key, session);
    writeAiImproveSession(storage, key, null);
    expect(storage.map.has(key)).toBe(false);
    expect(readAiImproveSession(null, key, 'abc12345')).toBeNull();
    expect(() => writeAiImproveSession(null, key, session)).not.toThrow();
  });
});
