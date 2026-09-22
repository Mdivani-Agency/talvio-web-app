import type { AccountContext, AccountEvents } from '@app/account/state/types';
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

export function accountProgressFromState(stateValue: unknown): AccountProgress | undefined {
  if (typeof stateValue === 'object' && stateValue && 'newAccount' in stateValue) {
    const step = (stateValue as { newAccount: string }).newAccount;
    if (step === 'accountForm' || step === 'accountQuestions') {
      return { step };
    }
  }
  return undefined;
}

export function accountContentFromContext(context: AccountContext): AccountDraftContent {
  return {
    scrapedResume: context.scrapedResume,
    partialDto: context.partialDto as AccountDraftContent['partialDto'],
    accountDto: context.accountDto as AccountDraftContent['accountDto'],
    tailoredAccount: context.tailoredAccount as AccountDraftContent['tailoredAccount'],
    questions: context.questions,
    answers: context.answers,
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

export function shouldSeedAccountFromQuery(stateValue: unknown) {
  return stateValue === 'fetchingAccount';
}

export function accountDraftRestoreEvents(
  content: AccountDraftContent,
  progress: AccountProgress,
): AccountEvents[] {
  const events: AccountEvents[] = [{ type: 'FETCHING_ACCOUNT_FAILURE' }];

  if (content.partialDto) {
    events.push({
      type: 'SET_PARTIAL_DTO',
      value: content.partialDto as AccountContext['partialDto'],
    });
  }
  if (content.scrapedResume) {
    events.push({ type: 'SET_RESUME_TEXT', value: content.scrapedResume });
  }
  if (progress.step === 'accountQuestions' && content.accountDto) {
    events.push({ type: 'SET_ACCOUNT_DTO', value: content.accountDto as AccountDto });
  }
  if (content.questions?.length) {
    events.push({ type: 'SET_QUESTIONS', value: content.questions as FeedbackQuestions });
  }
  if (content.answers) {
    events.push({ type: 'SET_ANSWERS', value: content.answers });
  }
  if (content.tailoredAccount) {
    events.push({ type: 'SET_TAILOR_ACCOUNT', value: content.tailoredAccount as AccountDto });
  }
  if (progress.questionIndex != null || progress.unsentAnswer != null) {
    events.push({
      type: 'SET_QUESTION_PROGRESS',
      value: {
        questionIndex: progress.questionIndex ?? 0,
        unsentAnswer: progress.unsentAnswer ?? '',
      },
    });
  }

  return events;
}

export function restoreAccountDraft(
  send: (event: AccountEvents) => void,
  content: AccountDraftContent,
  progress: AccountProgress,
) {
  for (const event of accountDraftRestoreEvents(content, progress)) {
    send(event);
  }
}

export function buildAccountDraft(input: {
  owner: DraftOwner;
  context: AccountContext;
  stateValue: unknown;
  existing?: VersionedDraft | null;
}): VersionedDraft | null {
  if (input.owner.kind !== 'user') {
    return null;
  }
  const progress = accountProgressFromState(input.stateValue);
  if (!progress) {
    return null;
  }
  progress.questionIndex = input.context.questionIndex ?? undefined;
  progress.unsentAnswer = input.context.unsentAnswer ?? undefined;

  return createVersionedDraft({
    kind: 'account',
    owner: input.owner,
    content: accountContentFromContext(input.context),
    progress,
    documentId: 'profile',
    draftId: input.existing?.draftId,
    createdAt: input.existing?.createdAt,
    baseUpdatedAt: input.existing?.baseUpdatedAt ?? input.context.account?.updatedAt,
  });
}

export function accountDraftToSnapshot(draft: VersionedDraft) {
  const parsed = parseAccountDraft(draft);
  if (!parsed) {
    return undefined;
  }

  return {
    status: 'active' as const,
    value: { newAccount: parsed.progress.step },
    context: {
      scrapedResume: parsed.content.scrapedResume ?? null,
      partialDto: (parsed.content.partialDto ?? null) as AccountContext['partialDto'],
      accountDto: (parsed.content.accountDto ?? null) as AccountContext['accountDto'],
      tailoredAccount: (parsed.content.tailoredAccount ?? null) as AccountContext['tailoredAccount'],
      questions: (parsed.content.questions ?? null) as AccountContext['questions'],
      answers: parsed.content.answers ?? null,
      parsingError: null,
      account: null,
      questionIndex: parsed.progress.questionIndex ?? null,
      unsentAnswer: parsed.progress.unsentAnswer ?? null,
    } satisfies AccountContext,
    children: {},
    historyValue: {},
  };
}
