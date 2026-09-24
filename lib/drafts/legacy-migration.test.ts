import { describe, expect, it } from 'vitest';

import { accountDraftStorageKey, resumeDraftStorageKey } from './keys';
import {
  LEGACY_UNSCOPED_RESUME_KEY,
  accountDraftFromLegacySnapshot,
  legacyAccountSnapshotKey,
  legacyMigrationMarkerKey,
  legacyResumeSnapshotKey,
  migrateLegacyAccount,
  migrateLegacyResume,
  migrateUnscopedResumeToGuest,
  resumeDraftFromLegacySnapshot,
  resumeInitialPersistStatus,
} from './legacy-migration';
import { parseAccountDraft } from './account-draft';
import { parseResumeDraft } from './resume-draft';
import type { DraftStorage } from './storage';
import {
  FLOW_GUEST_ID,
  FLOW_USER_ID,
  legacyAccountSnapshot,
  legacyResumeSnapshot,
} from '../../test/fixtures/flow';

function memoryStorage(seed: Record<string, string> = {}): DraftStorage & { dump: () => Record<string, string> } {
  const values = new Map(Object.entries(seed));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
    dump: () => Object.fromEntries(values),
  };
}

describe('legacy snapshot migration', () => {
  it('migrates account content and a live step once', () => {
    const owner = { kind: 'user' as const, userId: FLOW_USER_ID };
    const legacyKey = legacyAccountSnapshotKey(FLOW_USER_ID);
    const versionedKey = accountDraftStorageKey(owner);
    const storage = memoryStorage({
      [legacyKey]: JSON.stringify(legacyAccountSnapshot),
    });

    const first = migrateLegacyAccount(storage, owner, versionedKey);
    const parsed = parseAccountDraft(first.draft!);

    expect(first.migrated).toBe(true);
    expect(parsed?.progress.step).toBe('accountQuestions');
    expect(parsed?.content.answers).toEqual(['Preview pipeline', 'Skipped']);
    expect(parsed?.content.questions).toHaveLength(2);
    expect(parsed?.content.scrapedResume).toBe('Ada Owner\nStaff Engineer');
    expect(parsed?.content.accountDto).toMatchObject({
      profile: { firstName: 'Ada', email: 'ada@talvio.test' },
    });
    expect(JSON.stringify(first.draft)).not.toContain('historyValue');
    expect(JSON.stringify(first.draft)).not.toContain('parsingError');
    expect(storage.getItem(legacyKey)).toBe(JSON.stringify(legacyAccountSnapshot));
    expect(storage.getItem(legacyMigrationMarkerKey(legacyKey))).toBe(first.draft?.draftId);

    storage.setItem(versionedKey, JSON.stringify({
      ...first.draft,
      content: { ...parsed?.content, scrapedResume: 'newer local text' },
    }));
    const second = migrateLegacyAccount(storage, owner, versionedKey);
    expect(second.migrated).toBe(false);
    expect(parseAccountDraft(second.draft!)?.content.scrapedResume).toBe('newer local text');
  });

  it('maps previewResume onto profile review and does not route to a resume page', () => {
    const draft = accountDraftFromLegacySnapshot({
      value: { newAccount: 'previewResume' },
      context: legacyAccountSnapshot.context,
    }, { kind: 'user', userId: FLOW_USER_ID });

    expect(parseAccountDraft(draft!)?.progress.step).toBe('accountProfileReview');
    expect(JSON.stringify(draft)).not.toContain('previewResume');
    expect(JSON.stringify(draft)).not.toContain('/account/resume');
  });

  it('keeps a malformed account snapshot and does not write a draft', () => {
    const owner = { kind: 'user' as const, userId: FLOW_USER_ID };
    const legacyKey = legacyAccountSnapshotKey(FLOW_USER_ID);
    const versionedKey = accountDraftStorageKey(owner);
    const storage = memoryStorage({ [legacyKey]: '{not json' });

    const result = migrateLegacyAccount(storage, owner, versionedKey);

    expect(result).toMatchObject({ draft: null, status: 'invalid', migrated: false });
    expect(storage.getItem(legacyKey)).toBe('{not json');
    expect(storage.getItem(versionedKey)).toBeNull();
    expect(storage.getItem(legacyMigrationMarkerKey(legacyKey))).toBeNull();
  });

  it('does not restore a legacy account after the migrated draft is cleared', () => {
    const owner = { kind: 'user' as const, userId: FLOW_USER_ID };
    const legacyKey = legacyAccountSnapshotKey(FLOW_USER_ID);
    const versionedKey = accountDraftStorageKey(owner);
    const storage = memoryStorage({
      [legacyKey]: JSON.stringify(legacyAccountSnapshot),
    });

    migrateLegacyAccount(storage, owner, versionedKey);
    storage.removeItem(versionedKey);
    const again = migrateLegacyAccount(storage, owner, versionedKey);

    expect(again.migrated).toBe(false);
    expect(again.draft).toBeNull();
    expect(storage.getItem(legacyKey)).toBe(JSON.stringify(legacyAccountSnapshot));
  });

  it('migrates resume content without the runtime template and maps dead steps', () => {
    const owner = { kind: 'guest' as const, guestId: FLOW_GUEST_ID };
    const draft = resumeDraftFromLegacySnapshot(legacyResumeSnapshot, owner, 'new');
    const parsed = parseResumeDraft(draft!);

    expect(parsed?.progress.step).toBe('resumePreview');
    expect(parsed?.content).toMatchObject({
      name: 'Ada Owner',
      label: 'Draft',
      template: 'mid-level-ember',
      color: '#1B1B1B',
      fontSize: 'sm',
    });
    expect(parsed?.content.resume.profile.firstName).toBe('Ada');
    expect(JSON.stringify(draft)).not.toContain('runtime-template-object');
    expect(JSON.stringify(draft)).not.toContain('downloadResume');

    const download = resumeDraftFromLegacySnapshot({
      ...legacyResumeSnapshot,
      value: { newResume: 'downloadResume' },
    }, owner, 'new');
    expect(parseResumeDraft(download!)?.progress.step).toBe('resumePreview');
  });

  it('stores an unscoped new_resume snapshot as a guest draft', () => {
    const userKey = resumeDraftStorageKey({ kind: 'user', userId: FLOW_USER_ID }, 'new');
    const storage = memoryStorage({
      [LEGACY_UNSCOPED_RESUME_KEY]: JSON.stringify(legacyResumeSnapshot),
      'talvio-guest-id': FLOW_GUEST_ID,
    });

    const result = migrateUnscopedResumeToGuest(storage);
    const guestKey = resumeDraftStorageKey({ kind: 'guest', guestId: FLOW_GUEST_ID });

    expect(result.migrated).toBe(true);
    expect(result.draft?.owner).toEqual({ kind: 'guest', guestId: FLOW_GUEST_ID });
    expect(storage.getItem(userKey)).toBeNull();
    expect(storage.getItem(guestKey)).toContain(FLOW_GUEST_ID);
    expect(storage.getItem(LEGACY_UNSCOPED_RESUME_KEY)).toBe(JSON.stringify(legacyResumeSnapshot));

    const scoped = migrateLegacyResume({
      storage,
      owner: { kind: 'user', userId: FLOW_USER_ID },
      documentId: 'new',
      versionedKey: userKey,
    });
    expect(scoped.migrated).toBe(false);
    expect(storage.getItem(legacyResumeSnapshotKey('new'))).toBeNull();
  });

  it('rolls back the versioned draft when the marker cannot be stored', () => {
    const owner = { kind: 'user' as const, userId: FLOW_USER_ID };
    const legacyKey = legacyAccountSnapshotKey(FLOW_USER_ID);
    const versionedKey = accountDraftStorageKey(owner);
    const markerKey = legacyMigrationMarkerKey(legacyKey);
    const storage = memoryStorage({
      [legacyKey]: JSON.stringify(legacyAccountSnapshot),
    });
    const quota = new DOMException('quota', 'QuotaExceededError');
    const setItem = storage.setItem;
    storage.setItem = (key, value) => {
      if (key === markerKey) {
        throw quota;
      }
      setItem(key, value);
    };

    const result = migrateLegacyAccount(storage, owner, versionedKey);

    expect(result).toMatchObject({ draft: null, status: 'quota', migrated: false });
    expect(storage.getItem(versionedKey)).toBeNull();
    expect(storage.getItem(markerKey)).toBeNull();
    expect(storage.getItem(legacyKey)).toBe(JSON.stringify(legacyAccountSnapshot));
  });

  it('reports an unscoped snapshot failure when the current resume draft is empty', () => {
    const storage = memoryStorage({
      [LEGACY_UNSCOPED_RESUME_KEY]: '{not json',
      'talvio-guest-id': FLOW_GUEST_ID,
    });

    const unscoped = migrateUnscopedResumeToGuest(storage);

    expect(unscoped).toMatchObject({ draft: null, status: 'invalid', migrated: false });
    expect(storage.getItem(LEGACY_UNSCOPED_RESUME_KEY)).toBe('{not json');
    expect(resumeInitialPersistStatus({
      hasDraft: false,
      current: 'ok',
      scoped: 'ok',
      unscoped: unscoped.status,
    })).toBe('invalid');
    expect(resumeInitialPersistStatus({
      hasDraft: true,
      current: 'ok',
      scoped: 'ok',
      unscoped: 'invalid',
    })).toBe('ok');
  });
});
