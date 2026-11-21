'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  accountDraftStorageKey,
  browserStorage,
  migrateLegacyAccount,
  buildAccountDraft,
  clearDraft,
  createDebouncedWriter,
  emptyAccountDraftFields,
  hydrateAccountDraft,
  readParsedAccountDraft,
  writeDraft,
  type AccountDraftFields,
  type DebouncedWriter,
  type DraftPersistStatus,
  type OnboardingStep,
  type VersionedDraft,
} from '@lib/drafts';
import type { AccountDto, DeepPartial } from '@lib/types';

export type { OnboardingStep };

export function useAccountOnboarding(userId: string) {
  const owner = useMemo(() => ({ kind: 'user' as const, userId }), [userId]);
  const storage = useMemo(() => browserStorage(), []);
  const key = accountDraftStorageKey(owner);
  const initialRead = useMemo(() => {
    const migrated = migrateLegacyAccount(storage, owner, key);
    if (migrated.status === 'invalid' || migrated.status === 'quota' || migrated.status === 'unavailable') {
      const current = readParsedAccountDraft(storage, key);
      if (current.draft) {
        return current;
      }
      return { draft: null, parsed: null, status: migrated.status };
    }
    return readParsedAccountDraft(storage, key);
  }, [key, owner, storage]);
  const [persistStatus, setPersistStatus] = useState<DraftPersistStatus>(initialRead.status);
  const [fields, setFields] = useState<AccountDraftFields>(() => (
    initialRead.parsed
      ? hydrateAccountDraft(initialRead.parsed.content, initialRead.parsed.progress)
      : emptyAccountDraftFields()
  ));
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

  /**
   * Applies an import (MDI-674): the imported values replace the form, as a normal form change that the draft keeps.
   * The import dialog warned before it started when details were already entered, so there is no confirm after it.
   * `source` is the extracted PDF text or the pasted text, stored as `scrapedResume`.
   */
  const applyImport = useCallback((values: DeepPartial<AccountDto>, source?: string) => {
    liveValuesRef.current = values;
    updateFields({
      partialDto: values,
      accountDto: null,
      ...(source === undefined ? {} : { scrapedResume: source }),
    });
    setFormRevision((value) => value + 1);
  }, [updateFields]);

  const clearAccountDraft = useCallback(() => {
    clearedRef.current = true;
    writerRef.current?.cancel();
    draftRef.current = null;
    setPersistStatus(clearDraft(storage, key));
  }, [key, storage]);

  const setPartialDto = useCallback((partialDto: DeepPartial<AccountDto> | null) => {
    liveValuesRef.current = partialDto;
    updateFields({ partialDto });
  }, [updateFields]);

  /** Records the validated profile. The caller saves it (`useSaveProfileFlow`). */
  const submitProfile = useCallback((accountDto: AccountDto) => {
    liveValuesRef.current = accountDto;
    updateFields({ accountDto, partialDto: accountDto });
  }, [updateFields]);

  const completeSave = useCallback(() => {
    clearAccountDraft();
  }, [clearAccountDraft]);

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
    formRevision,
    setPartialDto,
    submitProfile,
    completeSave,
    applyImport,
    clearAccountDraft,
  };
}

export type AccountOnboarding = ReturnType<typeof useAccountOnboarding>;
