export { DRAFT_SCHEMA_VERSION } from './schema';
export type {
  AccountDraftContent,
  AccountProgress,
  DraftOwner,
  DraftPersistStatus,
  DraftReadResult,
  ResumeDraftContent,
  ResumeProgress,
  VersionedDraft,
} from './schema';
export { accountDraftStorageKey, DRAFT_KEY_PREFIX, GUEST_ID_KEY, resumeDraftStorageKey } from './keys';
export { getOrCreateGuestId, readGuestId } from './guest';
export {
  adoptDraft,
  browserStorage,
  clearDraft,
  copyDraftForRecovery,
  createDebouncedWriter,
  createDraftId,
  createVersionedDraft,
  isServerNewer,
  readDraft,
  writeDraft,
} from './storage';
export type { DebouncedWriter } from './storage';
export type { AccountDraftFields, OnboardingStep } from './account-draft';
export {
  accountContentFromFields,
  accountProgressFromStep,
  buildAccountDraft,
  emptyAccountDraftFields,
  hasOnboardingWork,
  hydrateAccountDraft,
  isPostFormStep,
  parseAccountDraft,
  readParsedAccountDraft,
  shouldConfirmImport,
} from './account-draft';
export {
  buildResumeDocumentDraft,
  buildResumeDraft,
  DEFAULT_RESUME_TEMPLATE,
  EMPTY_RESUME_PREVIEW,
  normalizeResumeTemplate,
  parseResumeDraft,
  readParsedResumeDraft,
  resumeDraftToPreview,
  resumeFlowStep,
  shouldSeedResumeFromQuery,
} from './resume-draft';
export {
  LEGACY_ACCOUNT_SNAPSHOT_PREFIX,
  LEGACY_RESUME_SNAPSHOT_PREFIX,
  LEGACY_UNSCOPED_RESUME_KEY,
  legacyAccountSnapshotKey,
  legacyMigrationMarkerKey,
  legacyResumeSnapshotKey,
  migrateLegacyAccount,
  migrateLegacyResume,
  migrateUnscopedResumeToGuest,
  resumeInitialPersistStatus,
  worsePersistStatus,
} from './legacy-migration';
