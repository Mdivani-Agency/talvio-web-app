import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FLOW_GUEST_ID, FLOW_USER_ID, versionedResumeDraft } from '../../test/fixtures/flow';
import { GUEST_ID_KEY } from './keys';
import { getOrCreateGuestId, readGuestId } from './guest';
import {
  adoptDraft,
  clearDraft,
  copyDraftForRecovery,
  createDebouncedWriter,
  createVersionedDraft,
  isServerNewer,
  readDraft,
  writeDraft,
} from './storage';

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key) {
      map.delete(key);
    },
    setItem(key, value) {
      map.set(key, value);
    },
  };
}

describe('versioned draft storage', () => {
  it('round-trips a valid draft and reports empty storage as ok', () => {
    const storage = memoryStorage();
    const draft = createVersionedDraft({
      kind: 'resume',
      owner: { kind: 'guest', guestId: FLOW_GUEST_ID },
      content: versionedResumeDraft.content,
      progress: versionedResumeDraft.progress,
      documentId: 'new',
    });

    expect(writeDraft(storage, 'resume', draft)).toBe('ok');
    expect(readDraft(storage, 'resume')).toEqual({ draft, status: 'ok' });
    expect(readDraft(storage, 'missing')).toEqual({ draft: null, status: 'ok' });
  });

  it('marks malformed JSON and unsupported schema as invalid', () => {
    const storage = memoryStorage();
    storage.setItem('bad-json', '{');
    storage.setItem('legacy', JSON.stringify({ status: 'active', value: 'options' }));

    expect(readDraft(storage, 'bad-json')).toEqual({ draft: null, status: 'invalid' });
    expect(readDraft(storage, 'legacy')).toEqual({ draft: null, status: 'invalid' });
    expect(readDraft(null, 'resume')).toEqual({ draft: null, status: 'unavailable' });
  });

  it('reports quota failures without throwing', () => {
    const storage = memoryStorage();
    storage.setItem = () => {
      throw new DOMException('quota', 'QuotaExceededError');
    };
    const draft = createVersionedDraft({
      kind: 'resume',
      owner: { kind: 'user', userId: FLOW_USER_ID },
      content: {},
    });

    expect(writeDraft(storage, 'resume', draft)).toBe('quota');
  });

  it('detects a newer server revision and copies a draft for recovery', () => {
    expect(isServerNewer('2026-09-21T12:00:00.000Z', '2026-09-21T13:00:00.000Z')).toBe(true);
    expect(isServerNewer('2026-09-21T13:00:00.000Z', '2026-09-21T12:00:00.000Z')).toBe(false);
    expect(isServerNewer(undefined, '2026-09-21T13:00:00.000Z')).toBe(false);

    const adopted = adoptDraft(versionedResumeDraft, { kind: 'user', userId: FLOW_USER_ID });
    expect(adopted.owner).toEqual({ kind: 'user', userId: FLOW_USER_ID });
    expect(adopted.draftId).toBe(versionedResumeDraft.draftId);

    const copy = copyDraftForRecovery({ ...versionedResumeDraft, documentId: 'abc', baseUpdatedAt: '2026-09-21T12:00:00.000Z' });
    expect(copy.draftId).not.toBe(versionedResumeDraft.draftId);
    expect(copy.documentId).toBeUndefined();
    expect(copy.baseUpdatedAt).toBeUndefined();
  });

  it('clears a stored draft', () => {
    const storage = memoryStorage();
    writeDraft(storage, 'resume', versionedResumeDraft);
    expect(clearDraft(storage, 'resume')).toBe('ok');
    expect(readDraft(storage, 'resume').draft).toBeNull();
  });
});

describe('createDebouncedWriter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces writes and flushes the latest value', () => {
    const write = vi.fn();
    const writer = createDebouncedWriter(write, 400);

    writer.schedule('one');
    writer.schedule('two');
    expect(write).not.toHaveBeenCalled();

    vi.advanceTimersByTime(400);
    expect(write).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledWith('two');

    writer.schedule('three');
    writer.flush();
    expect(write).toHaveBeenLastCalledWith('three');
    expect(write).toHaveBeenCalledTimes(2);
  });

  it('cancels a pending write without flushing', () => {
    const write = vi.fn();
    const writer = createDebouncedWriter(write, 400);

    writer.schedule('stale');
    writer.cancel();
    vi.advanceTimersByTime(400);
    writer.flush();

    expect(write).not.toHaveBeenCalled();
  });
});

describe('guest identity', () => {
  it('reuses a stored guest id and creates one when missing', () => {
    const storage = memoryStorage();
    expect(readGuestId(storage)).toBeNull();

    const created = getOrCreateGuestId(storage);
    expect(created).toEqual(expect.any(String));
    expect(storage.getItem(GUEST_ID_KEY)).toBe(created);
    expect(getOrCreateGuestId(storage)).toBe(created);
    expect(readGuestId(null)).toBeNull();
  });
});
