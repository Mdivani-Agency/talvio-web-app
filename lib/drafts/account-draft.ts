import type { AccountDto, DeepPartial } from '@lib/types';
import {
  assignQuestionIds,
  normalizeStoredAnswers,
  type OnboardingQuestion,
  type OnboardingRevision,
  type QuestionAnswer,
} from '@lib/onboarding/questions';

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

export type OnboardingStep = 'form' | 'questions' | 'answerReview' | 'proposalReview' | 'profileReview';

export type AccountDraftFields = {
  step: OnboardingStep;
  scrapedResume: string | null;
  partialDto: DeepPartial<AccountDto> | null;
  accountDto: AccountDto | null;
  tailoredAccount: AccountDto | null;
  reviewedAccount: AccountDto | null;
  questions: OnboardingQuestion[] | null;
  answers: QuestionAnswer[];
  currentQuestionId: string | null;
  unsentAnswer: string | null;
  profileRevision: number;
  answerRevision: number;
  proposalFor: OnboardingRevision | null;
};

const STEP_TO_PROGRESS: Record<OnboardingStep, AccountProgress['step']> = {
  form: 'accountForm',
  questions: 'accountQuestions',
  answerReview: 'accountAnswerReview',
  proposalReview: 'accountProposalReview',
  profileReview: 'accountProfileReview',
};

const PROGRESS_TO_STEP: Record<AccountProgress['step'], OnboardingStep> = {
  accountForm: 'form',
  accountQuestions: 'questions',
  accountAnswerReview: 'answerReview',
  accountProposalReview: 'proposalReview',
  accountProfileReview: 'profileReview',
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
    tailoredAccount: fields.tailoredAccount as AccountDraftContent['tailoredAccount'],
    reviewedAccount: fields.reviewedAccount as AccountDraftContent['reviewedAccount'],
    questions: fields.questions,
    answers: fields.answers,
    proposalFor: fields.proposalFor,
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
  const questions = content.questions ? assignQuestionIds(content.questions as OnboardingQuestion[]) : null;
  const answers = normalizeStoredAnswers(content.answers, questions ?? []);
  const currentQuestionId = progress.questionId
    ?? (progress.questionIndex != null ? questions?.[progress.questionIndex]?.id ?? null : null);
  const finishedLegacyCursor = progress.step === 'accountQuestions'
    && questions != null
    && progress.questionIndex === questions.length
    && currentQuestionId == null;
  const restoredStep = finishedLegacyCursor ? 'answerReview' : PROGRESS_TO_STEP[progress.step];

  return {
    step: content.accountDto && restoredStep !== 'form' ? restoredStep : 'form',
    scrapedResume: content.scrapedResume ?? null,
    partialDto: (content.partialDto ?? null) as AccountDraftFields['partialDto'],
    accountDto: (content.accountDto ?? null) as AccountDraftFields['accountDto'],
    tailoredAccount: (content.tailoredAccount ?? null) as AccountDraftFields['tailoredAccount'],
    reviewedAccount: (content.reviewedAccount ?? null) as AccountDraftFields['reviewedAccount'],
    questions,
    answers,
    currentQuestionId,
    unsentAnswer: progress.unsentAnswer ?? null,
    profileRevision: progress.profileRevision ?? 0,
    answerRevision: progress.answerRevision ?? 0,
    proposalFor: content.proposalFor ?? null,
  };
}

export function emptyAccountDraftFields(): AccountDraftFields {
  return {
    step: 'form',
    scrapedResume: null,
    partialDto: null,
    accountDto: null,
    tailoredAccount: null,
    reviewedAccount: null,
    questions: null,
    answers: [],
    currentQuestionId: null,
    unsentAnswer: null,
    profileRevision: 0,
    answerRevision: 0,
    proposalFor: null,
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
  progress.questionId = input.fields.currentQuestionId ?? undefined;
  progress.unsentAnswer = input.fields.unsentAnswer ?? undefined;
  progress.profileRevision = input.fields.profileRevision;
  progress.answerRevision = input.fields.answerRevision;
  if (input.fields.currentQuestionId && input.fields.questions) {
    const index = input.fields.questions.findIndex((question) => question.id === input.fields.currentQuestionId);
    progress.questionIndex = index >= 0 ? index : undefined;
  }

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
