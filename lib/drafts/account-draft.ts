import type { AccountDto, DeepPartial } from '@lib/types';

import {
  accountDraftContentSchema,
  accountProgressSchema,
  type AccountDraftContent,
  type AccountProgress,
  type DraftOwner,
  type DraftPersistStatus,
  type VersionedDraft,
} from './schema';
import { createVersionedDraft, readDraft, type DraftStorage } from './storage';

/** `voice` is rendered by the writing-voice step (MDI-418); nothing enters it yet. */
export type OnboardingStep = 'form' | 'voice';

export type AccountDraftFields = {
  step: OnboardingStep;
  scrapedResume: string | null;
  partialDto: DeepPartial<AccountDto> | null;
  accountDto: AccountDto | null;
};

const STEP_TO_PROGRESS: Record<OnboardingStep, AccountProgress['step']> = {
  form: 'accountForm',
  voice: 'accountVoice',
};

const PROFILE_TEXT_KEYS = [
  'firstName',
  'lastName',
  'role',
  'email',
  'phone',
  'website',
  'tagline',
  'city',
  'country',
] as const;

export function hasOnboardingWork(dto: DeepPartial<AccountDto> | null | undefined) {
  if (!dto) {
    return false;
  }
  const profile = dto.profile;
  if (profile && PROFILE_TEXT_KEYS.some((key) => Boolean(profile[key]))) {
    return true;
  }
  return Boolean(
    dto.experience?.length
    || dto.education?.length
    || dto.projects?.length
    || dto.skills?.length
    || dto.tools?.length
    || dto.languages?.length
    || dto.links?.length,
  );
}

export function shouldConfirmImport(current: DeepPartial<AccountDto> | null | undefined) {
  return hasOnboardingWork(current);
}

export function isPostFormStep(step: OnboardingStep) {
  return step !== 'form';
}

export function accountProgressFromStep(step: OnboardingStep): AccountProgress {
  return { step: STEP_TO_PROGRESS[step] };
}

export function accountContentFromFields(fields: AccountDraftFields): AccountDraftContent {
  return {
    scrapedResume: fields.scrapedResume,
    partialDto: fields.partialDto as AccountDraftContent['partialDto'],
    accountDto: fields.accountDto as AccountDraftContent['accountDto'],
  };
}

export function parseAccountDraft(draft: VersionedDraft) {
  const content = accountDraftContentSchema.safeParse(draft.content);
  const progress = accountProgressSchema.safeParse(draft.progress);
  if (!content.success || !progress.success) {
    return null;
  }
  return { content: content.data, progress: progress.data };
}

export function readParsedAccountDraft(storage: DraftStorage | null, key: string) {
  const result = readDraft(storage, key);
  if (!result.draft) {
    return { draft: null, parsed: null, status: result.status };
  }
  const parsed = parseAccountDraft(result.draft);
  if (!parsed) {
    return { draft: result.draft, parsed: null, status: 'invalid' as DraftPersistStatus };
  }
  return { draft: result.draft, parsed, status: result.status };
}

/**
 * Restores onboarding fields. Drafts from the removed questions flow (MDI-425) still parse:
 * any post-form step reopens the form with the last submitted values, and the old question,
 * answer and proposal fields are ignored.
 */
export function hydrateAccountDraft(
  content: AccountDraftContent,
  progress: AccountProgress,
): AccountDraftFields {
  const accountDto = (content.accountDto ?? null) as AccountDraftFields['accountDto'];
  const reviewedAccount = progress.step === 'accountProfileReview' ? content.reviewedAccount : null;
  const legacyValues = progress.step !== 'accountForm' && progress.step !== 'accountVoice'
    ? reviewedAccount ?? accountDto
    : null;

  return {
    step: 'form',
    scrapedResume: content.scrapedResume ?? null,
    partialDto: (legacyValues ?? content.partialDto ?? null) as AccountDraftFields['partialDto'],
    accountDto,
  };
}

export function emptyAccountDraftFields(): AccountDraftFields {
  return {
    step: 'form',
    scrapedResume: null,
    partialDto: null,
    accountDto: null,
  };
}

export function buildAccountDraft(input: {
  owner: DraftOwner;
  fields: AccountDraftFields;
  existing?: VersionedDraft | null;
  baseUpdatedAt?: string;
}): VersionedDraft | null {
  if (input.owner.kind !== 'user') {
    return null;
  }

  return createVersionedDraft({
    kind: 'account',
    owner: input.owner,
    content: accountContentFromFields(input.fields),
    progress: accountProgressFromStep(input.fields.step),
    documentId: 'profile',
    draftId: input.existing?.draftId,
    createdAt: input.existing?.createdAt,
    baseUpdatedAt: input.baseUpdatedAt ?? input.existing?.baseUpdatedAt,
  });
}
