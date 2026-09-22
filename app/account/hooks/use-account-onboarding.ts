'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  accountDraftStorageKey,
  browserStorage,
  buildAccountDraft,
  clearDraft,
  createDebouncedWriter,
  emptyAccountDraftFields,
  hydrateAccountDraft,
  readParsedAccountDraft,
  shouldConfirmImport,
  writeDraft,
  type AccountDraftFields,
  type DebouncedWriter,
  type DraftPersistStatus,
  type OnboardingStep,
  type VersionedDraft,
} from '@lib/drafts';
import {
  nextQuestionId,
  previousQuestionId,
  sameRevision,
  upsertAnswer,
  type OnboardingQuestion,
  type OnboardingRevision,
} from '@lib/onboarding/questions';
import type { AccountDto, DeepPartial } from '@lib/types';

export type { OnboardingStep };

export function useAccountOnboarding(userId: string) {
  const owner = useMemo(() => ({ kind: 'user' as const, userId }), [userId]);
  const storage = useMemo(() => browserStorage(), []);
  const key = accountDraftStorageKey(owner);
  const initialRead = useMemo(() => readParsedAccountDraft(storage, key), [key, storage]);
  const [persistStatus, setPersistStatus] = useState<DraftPersistStatus>(initialRead.status);
  const [fields, setFields] = useState<AccountDraftFields>(() => (
    initialRead.parsed
      ? hydrateAccountDraft(initialRead.parsed.content, initialRead.parsed.progress)
      : emptyAccountDraftFields()
  ));
  const [pendingImport, setPendingImport] = useState<DeepPartial<AccountDto> | null>(null);
  const [formRevision, setFormRevision] = useState(0);
  const draftRef = useRef<VersionedDraft | null>(initialRead.parsed ? initialRead.draft : null);
  const lastStepRef = useRef<OnboardingStep>(fields.step);
  const clearedRef = useRef(false);
  const liveValuesRef = useRef<DeepPartial<AccountDto> | null>(fields.partialDto ?? fields.accountDto);
  const writerRef = useRef<DebouncedWriter<VersionedDraft | null> | null>(null);

  const updateFields = useCallback((patch: Partial<AccountDraftFields>) => {
    setFields((current) => {
      const next = { ...current, ...patch };
      if ('partialDto' in patch || 'accountDto' in patch) {
        liveValuesRef.current = next.partialDto ?? next.accountDto;
      }
      return next;
    });
  }, []);

  const applyParsed = useCallback((parsed: DeepPartial<AccountDto>) => {
    liveValuesRef.current = parsed;
    updateFields({ partialDto: parsed, accountDto: null });
    setPendingImport(null);
    setFormRevision((value) => value + 1);
  }, [updateFields]);

  const clearAccountDraft = useCallback(() => {
    clearedRef.current = true;
    writerRef.current?.cancel();
    draftRef.current = null;
    setPendingImport(null);
    setPersistStatus(clearDraft(storage, key));
  }, [key, storage]);

  const setPartialDto = useCallback((partialDto: DeepPartial<AccountDto> | null) => {
    liveValuesRef.current = partialDto;
    updateFields({ partialDto });
  }, [updateFields]);

  const submitProfile = useCallback((accountDto: AccountDto) => {
    setFields((current) => {
      liveValuesRef.current = accountDto;
      return {
        ...current,
        accountDto,
        partialDto: accountDto,
        step: 'questions',
        profileRevision: current.profileRevision + 1,
        answerRevision: 0,
        questions: null,
        answers: [],
        currentQuestionId: null,
        unsentAnswer: '',
        tailoredAccount: null,
        reviewedAccount: null,
        proposalFor: null,
      };
    });
  }, []);

  const goBackToForm = useCallback(() => {
    updateFields({ step: 'form' });
  }, [updateFields]);

  const receiveQuestions = useCallback((questions: OnboardingQuestion[], profileRevision: number) => {
    setFields((current) => {
      if (current.profileRevision !== profileRevision) {
        return current;
      }
      if (questions.length === 0) {
        return {
          ...current,
          questions,
          currentQuestionId: null,
          unsentAnswer: '',
          step: 'answerReview',
        };
      }
      return {
        ...current,
        questions,
        currentQuestionId: current.currentQuestionId ?? questions[0].id,
        unsentAnswer: current.unsentAnswer ?? '',
      };
    });
  }, []);

  const setUnsentAnswer = useCallback((unsentAnswer: string) => {
    updateFields({ unsentAnswer });
  }, [updateFields]);

  const answerCurrent = useCallback((status: 'answered' | 'skipped', value: string) => {
    setFields((current) => {
      const questionId = current.currentQuestionId;
      if (!questionId || !current.questions) {
        return current;
      }
      const answers = upsertAnswer(current.answers, { questionId, status, value });
      const nextId = nextQuestionId(current.questions, questionId);
      return {
        ...current,
        answers,
        answerRevision: current.answerRevision + 1,
        proposalFor: null,
        tailoredAccount: null,
        currentQuestionId: nextId,
        unsentAnswer: nextId
          ? current.answers.find((answer) => answer.questionId === nextId)?.value ?? ''
          : '',
        step: nextId ? 'questions' : 'answerReview',
      };
    });
  }, []);

  const goToPreviousQuestion = useCallback(() => {
    setFields((current) => {
      if (!current.questions) {
        return current;
      }
      const previousId = previousQuestionId(current.questions, current.currentQuestionId);
      if (!previousId) {
        return current;
      }
      return {
        ...current,
        currentQuestionId: previousId,
        unsentAnswer: current.answers.find((answer) => answer.questionId === previousId)?.value ?? '',
      };
    });
  }, []);

  const continueWithoutAi = useCallback(() => {
    setFields((current) => ({
      ...current,
      tailoredAccount: null,
      reviewedAccount: current.accountDto,
      step: 'profileReview',
    }));
  }, []);

  const receiveProposal = useCallback((proposal: AccountDto, revision: OnboardingRevision) => {
    setFields((current) => {
      if (!sameRevision({
        profileRevision: current.profileRevision,
        answerRevision: current.answerRevision,
      }, revision)) {
        return current;
      }
      return {
        ...current,
        tailoredAccount: proposal,
        proposalFor: revision,
        step: 'proposalReview',
      };
    });
  }, []);

  const acceptProposal = useCallback(() => {
    setFields((current) => ({
      ...current,
      reviewedAccount: current.tailoredAccount ?? current.accountDto,
      step: 'profileReview',
    }));
  }, []);

  const rejectProposal = useCallback(() => {
    setFields((current) => ({
      ...current,
      reviewedAccount: current.accountDto,
      step: 'profileReview',
    }));
  }, []);

  const setReviewedAccount = useCallback((reviewedAccount: AccountDto) => {
    updateFields({ reviewedAccount });
  }, [updateFields]);

  const goToAnswerReview = useCallback(() => {
    updateFields({ step: 'answerReview' });
  }, [updateFields]);

  const completeSave = useCallback(() => {
    clearAccountDraft();
  }, [clearAccountDraft]);

  const offerImport = useCallback((parsed: DeepPartial<AccountDto>) => {
    const current = liveValuesRef.current ?? fields.partialDto ?? fields.accountDto;
    if (shouldConfirmImport(current)) {
      setPendingImport(parsed);
      return;
    }
    applyParsed(parsed);
  }, [applyParsed, fields.accountDto, fields.partialDto]);

  const applyImport = useCallback(() => {
    if (!pendingImport) {
      return;
    }
    applyParsed(pendingImport);
  }, [applyParsed, pendingImport]);

  const cancelImport = useCallback(() => {
    setPendingImport(null);
  }, []);

  useEffect(() => {
    const writer = createDebouncedWriter((draft: VersionedDraft | null) => {
      if (clearedRef.current) {
        return;
      }
      if (!draft) {
        setPersistStatus(clearDraft(storage, key));
        return;
      }
      setPersistStatus(writeDraft(storage, key, draft));
    });
    writerRef.current = writer;

    const persistOrCancel = () => {
      if (clearedRef.current) {
        writer.cancel();
        return;
      }
      writer.flush();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        persistOrCancel();
      }
    };
    window.addEventListener('pagehide', persistOrCancel);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      persistOrCancel();
      if (writerRef.current === writer) {
        writerRef.current = null;
      }
      window.removeEventListener('pagehide', persistOrCancel);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [key, storage]);

  useEffect(() => {
    if (clearedRef.current) {
      writerRef.current?.cancel();
      return;
    }

    const nextDraft = buildAccountDraft({
      owner,
      fields,
      existing: draftRef.current,
    });
    if (!nextDraft || !writerRef.current) {
      return;
    }

    const stepChanged = lastStepRef.current !== fields.step;
    lastStepRef.current = fields.step;
    draftRef.current = nextDraft;
    writerRef.current.schedule(nextDraft);
    if (stepChanged) {
      writerRef.current.flush();
    }
  }, [fields, owner]);

  return {
    userId,
    step: fields.step,
    persistStatus,
    partialDto: fields.partialDto,
    accountDto: fields.accountDto,
    scrapedResume: fields.scrapedResume,
    questions: fields.questions,
    answers: fields.answers,
    currentQuestionId: fields.currentQuestionId,
    unsentAnswer: fields.unsentAnswer,
    tailoredAccount: fields.tailoredAccount,
    reviewedAccount: fields.reviewedAccount,
    profileRevision: fields.profileRevision,
    answerRevision: fields.answerRevision,
    pendingImport,
    formRevision,
    setPartialDto,
    submitProfile,
    goBackToForm,
    receiveQuestions,
    setUnsentAnswer,
    answerCurrent,
    goToPreviousQuestion,
    continueWithoutAi,
    receiveProposal,
    acceptProposal,
    rejectProposal,
    setReviewedAccount,
    goToAnswerReview,
    completeSave,
    offerImport,
    applyImport,
    cancelImport,
    clearAccountDraft,
  };
}

export type AccountOnboarding = ReturnType<typeof useAccountOnboarding>;
