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
import type { AccountDto, DeepPartial, FeedbackQuestions } from '@lib/types';

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
    updateFields({
      accountDto,
      partialDto: accountDto,
      step: 'questions',
    });
  }, [updateFields]);

  const goBackToForm = useCallback(() => {
    updateFields({ step: 'form' });
  }, [updateFields]);

  const setQuestions = useCallback((questions: FeedbackQuestions) => {
    updateFields({ questions });
  }, [updateFields]);

  const setAnswers = useCallback((answers: string[]) => {
    updateFields({ answers });
  }, [updateFields]);

  const setQuestionProgress = useCallback((questionIndex: number, unsentAnswer: string) => {
    updateFields({ questionIndex, unsentAnswer });
  }, [updateFields]);

  const setTailoredAccount = useCallback((tailoredAccount: AccountDto) => {
    updateFields({ tailoredAccount });
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
    questionIndex: fields.questionIndex,
    unsentAnswer: fields.unsentAnswer,
    tailoredAccount: fields.tailoredAccount,
    pendingImport,
    formRevision,
    setPartialDto,
    submitProfile,
    goBackToForm,
    setQuestions,
    setAnswers,
    setQuestionProgress,
    setTailoredAccount,
    completeSave,
    offerImport,
    applyImport,
    cancelImport,
    clearAccountDraft,
  };
}

export type AccountOnboarding = ReturnType<typeof useAccountOnboarding>;
