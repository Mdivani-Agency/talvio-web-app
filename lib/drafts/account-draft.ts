import type { AccountDto, FeedbackQuestions } from '@lib/types';

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

export type OnboardingStep = 'form' | 'questions';

export type AccountDraftFields = {
  step: OnboardingStep;
  scrapedResume: string | null;
  partialDto: Partial<AccountDto> | null;
  accountDto: AccountDto | null;
  tailoredAccount: AccountDto | null;
  questions: FeedbackQuestions | null;
  answers: string[] | null;
  questionIndex: number | null;
  unsentAnswer: string | null;
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

export function hasOnboardingWork(dto: Partial<AccountDto> | null | undefined) {
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

export function shouldConfirmImport(current: Partial<AccountDto> | null | undefined) {
  return hasOnboardingWork(current);
}

export function accountProgressFromStep(step: OnboardingStep): AccountProgress {
  return { step: step === 'questions' ? 'accountQuestions' : 'accountForm' };
}

export function accountContentFromFields(fields: AccountDraftFields): AccountDraftContent {
  return {
    scrapedResume: fields.scrapedResume,
    partialDto: fields.partialDto as AccountDraftContent['partialDto'],
    accountDto: fields.accountDto as AccountDraftContent['accountDto'],
    tailoredAccount: fields.tailoredAccount as AccountDraftContent['tailoredAccount'],
    questions: fields.questions,
    answers: fields.answers,
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

export function hydrateAccountDraft(
  content: AccountDraftContent,
  progress: AccountProgress,
): AccountDraftFields {
  return {
    step: progress.step === 'accountQuestions' && content.accountDto ? 'questions' : 'form',
    scrapedResume: content.scrapedResume ?? null,
    partialDto: (content.partialDto ?? null) as AccountDraftFields['partialDto'],
    accountDto: (content.accountDto ?? null) as AccountDraftFields['accountDto'],
    tailoredAccount: (content.tailoredAccount ?? null) as AccountDraftFields['tailoredAccount'],
    questions: (content.questions ?? null) as AccountDraftFields['questions'],
    answers: content.answers ?? null,
    questionIndex: progress.questionIndex ?? null,
    unsentAnswer: progress.unsentAnswer ?? null,
  };
}

export function emptyAccountDraftFields(): AccountDraftFields {
  return {
    step: 'form',
    scrapedResume: null,
    partialDto: null,
    accountDto: null,
    tailoredAccount: null,
    questions: null,
    answers: null,
    questionIndex: null,
    unsentAnswer: null,
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

  const progress = accountProgressFromStep(input.fields.step);
  progress.questionIndex = input.fields.questionIndex ?? undefined;
  progress.unsentAnswer = input.fields.unsentAnswer ?? undefined;

  return createVersionedDraft({
    kind: 'account',
    owner: input.owner,
    content: accountContentFromFields(input.fields),
    progress,
    documentId: 'profile',
    draftId: input.existing?.draftId,
    createdAt: input.existing?.createdAt,
    baseUpdatedAt: input.baseUpdatedAt ?? input.existing?.baseUpdatedAt,
  });
}
