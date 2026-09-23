import { profileToResumeDocument } from '@lib/models/resume-document';
import { resumeDraftSchema } from '@lib/schema/resume.schema';
import { RESUME_COLORS_MAP } from '@lib/utils';
import type { AccountDto } from '@lib/types';

import { resumeDraftStorageKey } from './keys';
import { getOrCreateGuestId } from './guest';
import {
  accountDraftContentSchema,
  accountProgressSchema,
  resumeDraftContentSchema,
  type AccountProgress,
  type DraftOwner,
  type DraftPersistStatus,
  type ResumeDraftContent,
  type ResumeProgress,
  type VersionedDraft,
} from './schema';
import { createVersionedDraft, readDraft, writeDraft, type DraftStorage } from './storage';
import { normalizeResumeTemplate } from './resume-draft';

export const LEGACY_ACCOUNT_SNAPSHOT_PREFIX = 'account-state-snapshot';
export const LEGACY_RESUME_SNAPSHOT_PREFIX = 'resume-state-snapshot';
export const LEGACY_UNSCOPED_RESUME_KEY = `${LEGACY_RESUME_SNAPSHOT_PREFIX}-new_resume`;

export function legacyAccountSnapshotKey(userId: string) {
  return `${LEGACY_ACCOUNT_SNAPSHOT_PREFIX}-${userId}`;
}

export function legacyResumeSnapshotKey(documentId: string) {
  return `${LEGACY_RESUME_SNAPSHOT_PREFIX}-${documentId}`;
}

export function legacyMigrationMarkerKey(legacyKey: string) {
  return `talvio-legacy-migrated:${legacyKey}`;
}

type MigrationResult = {
  draft: VersionedDraft | null;
  status: DraftPersistStatus;
  migrated: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readRaw(storage: DraftStorage, key: string) {
  try {
    return { raw: storage.getItem(key), failed: false };
  } catch {
    return { raw: null, failed: true };
  }
}

function stateLeaf(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  if (!isRecord(value)) {
    return undefined;
  }
  const entries = Object.entries(value);
  if (entries.length !== 1) {
    return undefined;
  }
  const [key, child] = entries[0];
  if (typeof child === 'string') {
    return child;
  }
  return stateLeaf(child) ?? key;
}

function accountStepFromLegacy(value: unknown): AccountProgress['step'] {
  switch (stateLeaf(value)) {
    case 'accountQuestions':
      return 'accountQuestions';
    case 'accountAnswerReview':
      return 'accountAnswerReview';
    case 'accountProposalReview':
      return 'accountProposalReview';
    case 'accountProfileReview':
    case 'accountPreview':
    case 'accountReady':
    case 'previewResume':
      return 'accountProfileReview';
    default:
      return 'accountForm';
  }
}

function mapResumeLeaf(leaf: string | undefined): ResumeProgress['step'] | null {
  if (leaf === 'options' || leaf === 'importResume' || leaf === 'existingResume') {
    return leaf;
  }
  if (leaf === 'uploadResume') {
    return 'importResume';
  }
  if (
    leaf === 'resumePreview'
    || leaf === 'newResume'
    || leaf === 'resumeForm'
    || leaf === 'downloadResume'
  ) {
    return 'resumePreview';
  }
  return null;
}

function resumeStepFromLegacy(value: unknown, historyValue: unknown): ResumeProgress['step'] | null {
  return mapResumeLeaf(stateLeaf(value)) ?? mapResumeLeaf(stateLeaf(historyValue));
}

export function accountDraftFromLegacySnapshot(
  snapshot: unknown,
  owner: Extract<DraftOwner, { kind: 'user' }>,
): VersionedDraft | null {
  if (!isRecord(snapshot) || !isRecord(snapshot.context)) {
    return null;
  }
  const context = snapshot.context;
  const content = accountDraftContentSchema.safeParse({
    scrapedResume: typeof context.scrapedResume === 'string' ? context.scrapedResume : null,
    partialDto: isRecord(context.partialDto) ? context.partialDto : null,
    accountDto: isRecord(context.accountDto) ? context.accountDto : null,
    tailoredAccount: isRecord(context.tailoredAccount) ? context.tailoredAccount : null,
    questions: Array.isArray(context.questions) ? context.questions : null,
    answers: Array.isArray(context.answers) ? context.answers : null,
  });
  if (!content.success) {
    return null;
  }
  const step = accountStepFromLegacy(snapshot.value);
  const hasWork = Boolean(
    content.data.accountDto
    || content.data.partialDto
    || content.data.scrapedResume
    || content.data.questions?.length
    || content.data.answers?.length,
  );
  if (!hasWork) {
    return null;
  }
  const progress = accountProgressSchema.parse({
    step,
    ...(typeof context.questionIndex === 'number' ? { questionIndex: context.questionIndex } : {}),
    ...(typeof context.unsentAnswer === 'string' ? { unsentAnswer: context.unsentAnswer } : {}),
  });
  return createVersionedDraft({
    kind: 'account',
    owner,
    documentId: 'profile',
    content: content.data,
    progress,
  });
}

function resumeContentFromLegacy(dto: unknown): ResumeDraftContent | null {
  if (!isRecord(dto)) {
    return null;
  }
  let resume: unknown = dto.resume;
  if (!resumeDraftSchema.safeParse(resume).success && isRecord(resume) && isRecord(resume.profile)) {
    try {
      resume = profileToResumeDocument(resume as AccountDto);
    } catch {
      return null;
    }
  }
  const fontSize = dto.fontSize === 'sm' || dto.fontSize === 'md' || dto.fontSize === 'lg'
    ? dto.fontSize
    : 'md';
  const content = resumeDraftContentSchema.safeParse({
    resume,
    name: typeof dto.name === 'string' && dto.name.trim() ? dto.name : 'my resume',
    ...(typeof dto.label === 'string' && dto.label ? { label: dto.label } : {}),
    template: normalizeResumeTemplate(dto.template),
    color: typeof dto.color === 'string' && dto.color ? dto.color : RESUME_COLORS_MAP.black,
    fontSize,
  });
  return content.success ? content.data : null;
}

export function resumeDraftFromLegacySnapshot(
  snapshot: unknown,
  owner: DraftOwner,
  documentId: string,
): VersionedDraft | null {
  if (!isRecord(snapshot)) {
    return null;
  }
  const content = resumeContentFromLegacy(snapshot.context && isRecord(snapshot.context)
    ? snapshot.context.resumeDto
    : null);
  if (!content) {
    return null;
  }
  const step = resumeStepFromLegacy(snapshot.value, snapshot.historyValue) ?? 'options';
  return createVersionedDraft({
    kind: 'resume',
    owner,
    documentId,
    content,
    progress: { step },
  });
}

export function migrateLegacySnapshot(input: {
  storage: DraftStorage | null;
  versionedKey: string;
  legacyKey: string;
  convert: (snapshot: unknown) => VersionedDraft | null;
}): MigrationResult {
  if (!input.storage) {
    return { draft: null, status: 'unavailable', migrated: false };
  }

  const existing = readDraft(input.storage, input.versionedKey);
  if (existing.draft) {
    return { draft: existing.draft, status: existing.status, migrated: false };
  }
  if (existing.status === 'invalid') {
    return { draft: null, status: 'invalid', migrated: false };
  }

  const marker = readRaw(input.storage, legacyMigrationMarkerKey(input.legacyKey));
  if (marker.failed) {
    return { draft: null, status: 'unavailable', migrated: false };
  }
  if (marker.raw) {
    return { draft: null, status: 'ok', migrated: false };
  }

  const legacy = readRaw(input.storage, input.legacyKey);
  if (legacy.failed) {
    return { draft: null, status: 'unavailable', migrated: false };
  }
  if (!legacy.raw) {
    return { draft: null, status: 'ok', migrated: false };
  }

  let snapshot: unknown;
  try {
    snapshot = JSON.parse(legacy.raw);
  } catch {
    return { draft: null, status: 'invalid', migrated: false };
  }

  let draft: VersionedDraft | null;
  try {
    draft = input.convert(snapshot);
  } catch {
    return { draft: null, status: 'invalid', migrated: false };
  }
  if (!draft) {
    return { draft: null, status: 'invalid', migrated: false };
  }

  const written = writeDraft(input.storage, input.versionedKey, draft);
  if (written !== 'ok') {
    return { draft: null, status: written, migrated: false };
  }

  try {
    input.storage.setItem(legacyMigrationMarkerKey(input.legacyKey), draft.draftId);
  } catch {
    // The versioned draft is already stored, so a later load will not overwrite it.
  }
  return { draft, status: 'ok', migrated: true };
}

export function migrateLegacyAccount(
  storage: DraftStorage | null,
  owner: Extract<DraftOwner, { kind: 'user' }>,
  versionedKey: string,
) {
  return migrateLegacySnapshot({
    storage,
    versionedKey,
    legacyKey: legacyAccountSnapshotKey(owner.userId),
    convert: (snapshot) => accountDraftFromLegacySnapshot(snapshot, owner),
  });
}

export function migrateLegacyResume(input: {
  storage: DraftStorage | null;
  owner: DraftOwner;
  documentId: string;
  versionedKey: string;
}) {
  return migrateLegacySnapshot({
    storage: input.storage,
    versionedKey: input.versionedKey,
    legacyKey: legacyResumeSnapshotKey(input.documentId),
    convert: (snapshot) => resumeDraftFromLegacySnapshot(snapshot, input.owner, input.documentId),
  });
}

export function migrateUnscopedResumeToGuest(storage: DraftStorage | null) {
  if (!storage) {
    return { draft: null, status: 'unavailable' as const, migrated: false };
  }
  const legacy = readRaw(storage, LEGACY_UNSCOPED_RESUME_KEY);
  if (legacy.failed || !legacy.raw) {
    return { draft: null, status: legacy.failed ? 'unavailable' as const : 'ok' as const, migrated: false };
  }
  const guestId = getOrCreateGuestId(storage);
  if (!guestId) {
    return { draft: null, status: 'unavailable' as const, migrated: false };
  }
  const owner = { kind: 'guest' as const, guestId };
  return migrateLegacySnapshot({
    storage,
    versionedKey: resumeDraftStorageKey(owner),
    legacyKey: LEGACY_UNSCOPED_RESUME_KEY,
    convert: (snapshot) => resumeDraftFromLegacySnapshot(snapshot, owner, 'new'),
  });
}
