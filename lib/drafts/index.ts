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
export {
  accountContentFromContext,
  accountDraftRestoreEvents,
  accountDraftToSnapshot,
  accountProgressFromState,
  buildAccountDraft,
  parseAccountDraft,
  readParsedAccountDraft,
  restoreAccountDraft,
  shouldSeedAccountFromQuery,
} from './account-draft';
export {
  buildResumeDraft,
  EMPTY_RESUME_PREVIEW,
  parseResumeDraft,
  readParsedResumeDraft,
  restoreResumeDraft,
  resumeDraftRestoreEvents,
  resumeDraftToPreview,
  resumeDraftToSnapshot,
  resumeProgressFromState,
  shouldSeedResumeFromQuery,
} from './resume-draft';
