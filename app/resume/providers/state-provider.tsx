'use client';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Loading } from '@components/views';
import { DraftStatusBanner } from '@components/views/draft-status';
import {
  adoptDraft,
  browserStorage,
  buildResumeDraft,
  clearDraft,
  copyDraftForRecovery,
  createDebouncedWriter,
  EMPTY_RESUME_PREVIEW,
  getOrCreateGuestId,
  migrateLegacyResume,
  migrateUnscopedResumeToGuest,
  parseResumeDraft,
  readParsedResumeDraft,
  resumeDraftStorageKey,
  resumeDraftToPreview,
  resumeFlowStep,
  writeDraft,
  type DebouncedWriter,
  type DraftOwner,
  type DraftPersistStatus,
  type ResumeProgress,
  type VersionedDraft,
} from '@lib/drafts';
import { useUserSession } from '@lib/providers';
import type { PreviewDto } from '@lib/types';

export type ResumeFlowStep = 'fetchingResume' | 'options' | 'importResume' | 'resumePreview';

type ResumeFlowState = {
  step: ResumeFlowStep;
  resume: PreviewDto;
};

type ContextState = {
  resumeId: string;
  step: ResumeFlowStep;
  resume: PreviewDto;
  persistStatus: DraftPersistStatus;
  guestDraft: VersionedDraft | null;
  adoptGuestDraft: () => void;
  discardGuestDraft: () => void;
  clearResumeDraft: () => void;
  ensureDraftId: () => string;
  seedIfFetching: (resume: PreviewDto) => void;
  selectImport: () => void;
  selectManual: () => void;
  applyImportedResume: (resume: PreviewDto) => void;
  changeResume: (resume: PreviewDto) => void;
};

const ResumeContext = createContext<ContextState | null>(null);

function progressStep(step: ResumeFlowStep): ResumeProgress['step'] {
  if (step === 'importResume' || step === 'options') {
    return step;
  }
  return 'resumePreview';
}

function flowFromDraft(draft: VersionedDraft): ResumeFlowState | null {
  const parsed = parseResumeDraft(draft);
  const resume = resumeDraftToPreview(draft);
  if (!parsed || !resume) {
    return null;
  }
  return { step: resumeFlowStep(parsed.progress.step), resume };
}

function ResumeMachine({
  children,
  owner,
  documentId,
}: PropsWithChildren<{ owner: DraftOwner; documentId: string }>) {
  const storage = useMemo(() => browserStorage(), []);
  const key = resumeDraftStorageKey(owner, documentId);
  const guestKey = useMemo(() => {
    if (owner.kind !== 'user' || !storage) {
      return null;
    }
    const guestId = getOrCreateGuestId(storage);
    return guestId ? resumeDraftStorageKey({ kind: 'guest', guestId }, 'new') : null;
  }, [owner, storage]);
  const [initialRead] = useState(() => {
    const migrated = migrateLegacyResume({ storage, owner, documentId, versionedKey: key });
    migrateUnscopedResumeToGuest(storage);
    const current = readParsedResumeDraft(storage, key);
    if (current.draft) {
      return current;
    }
    if (migrated.status === 'invalid' || migrated.status === 'quota' || migrated.status === 'unavailable') {
      return { draft: null, parsed: null, status: migrated.status };
    }
    return current;
  });
  const [guestRead] = useState(() => (
    guestKey ? readParsedResumeDraft(storage, guestKey) : { draft: null, parsed: null, status: 'ok' as const }
  ));
  const [persistStatus, setPersistStatus] = useState<DraftPersistStatus>(initialRead.status);
  const [guestDraft, setGuestDraft] = useState<VersionedDraft | null>(
    owner.kind === 'user' && !initialRead.parsed && guestRead.parsed ? guestRead.draft : null,
  );
  const [flow, setFlow] = useState<ResumeFlowState>(() => {
    if (initialRead.parsed) {
      const resume = resumeDraftToPreview(initialRead.draft!);
      if (resume) {
        return { step: resumeFlowStep(initialRead.parsed.progress.step), resume };
      }
    }
    return { step: 'fetchingResume', resume: EMPTY_RESUME_PREVIEW };
  });
  const draftRef = useRef<VersionedDraft | null>(initialRead.parsed ? initialRead.draft : null);
  const clearedRef = useRef(false);
  const lastStepRef = useRef<ResumeFlowStep>(flow.step);
  const writerRef = useRef<DebouncedWriter<VersionedDraft | null> | null>(null);

  const persistCurrent = (nextDraft: VersionedDraft | null) => {
    draftRef.current = nextDraft;
    if (!nextDraft) {
      setPersistStatus(clearDraft(storage, key));
      return;
    }
    setPersistStatus(writeDraft(storage, key, nextDraft));
  };

  const clearResumeDraft = () => {
    clearedRef.current = true;
    writerRef.current?.cancel();
    persistCurrent(null);
  };

  const ensureDraftId = () => {
    const built = buildResumeDraft({
      owner,
      document: flow.resume,
      step: progressStep(flow.step),
      existing: draftRef.current,
      documentId,
    });
    if (!built) {
      throw new Error('Resume draft is not ready to save');
    }
    clearedRef.current = false;
    persistCurrent(built);
    return built.draftId;
  };

  const updateFlow = (next: ResumeFlowState) => {
    clearedRef.current = false;
    setFlow(next);
  };

  const adoptGuestDraft = () => {
    if (!guestDraft) {
      return;
    }
    const adopted = adoptDraft(guestDraft, owner);
    const restored = flowFromDraft(adopted);
    if (guestKey) {
      clearDraft(storage, guestKey);
    }
    setGuestDraft(null);
    if (!restored) {
      return;
    }
    clearedRef.current = false;
    draftRef.current = adopted;
    setFlow(restored);
    persistCurrent(adopted);
  };

  const discardGuestDraft = () => {
    if (guestKey) {
      clearDraft(storage, guestKey);
    }
    setGuestDraft(null);
  };

  const keepLocalCopy = () => {
    if (!draftRef.current) {
      return;
    }
    clearedRef.current = false;
    persistCurrent(copyDraftForRecovery(draftRef.current));
    setPersistStatus('ok');
  };

  useEffect(() => {
    const writer = createDebouncedWriter((draft: VersionedDraft | null) => {
      if (clearedRef.current) {
        return;
      }
      persistCurrent(draft);
    });
    writerRef.current = writer;

    const flush = () => {
      if (clearedRef.current) {
        writer.cancel();
        return;
      }
      writer.flush();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        flush();
      }
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      flush();
      if (writerRef.current === writer) {
        writerRef.current = null;
      }
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // persistCurrent closes over the latest key/storage for this mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, key, owner, storage]);

  useEffect(() => {
    if (clearedRef.current || flow.step === 'fetchingResume') {
      return;
    }
    const nextDraft = buildResumeDraft({
      owner,
      document: flow.resume,
      step: progressStep(flow.step),
      existing: draftRef.current,
      documentId,
    });
    if (!nextDraft || !writerRef.current) {
      return;
    }
    const stepChanged = lastStepRef.current !== flow.step;
    lastStepRef.current = flow.step;
    draftRef.current = nextDraft;
    writerRef.current.schedule(nextDraft);
    if (stepChanged) {
      writerRef.current.flush();
    }
  }, [documentId, flow, owner]);

  return (
    <ResumeContext.Provider
      value={{
        resumeId: documentId,
        step: flow.step,
        resume: flow.resume,
        persistStatus,
        guestDraft,
        adoptGuestDraft,
        discardGuestDraft,
        clearResumeDraft,
        ensureDraftId,
        seedIfFetching: (resume) => {
          setFlow((current) => (
            current.step === 'fetchingResume' ? { step: 'options', resume } : current
          ));
        },
        selectImport: () => updateFlow({ ...flow, step: 'importResume' }),
        selectManual: () => updateFlow({ ...flow, step: 'resumePreview' }),
        applyImportedResume: (resume) => updateFlow({ step: 'resumePreview', resume }),
        changeResume: (resume) => updateFlow({ ...flow, resume }),
      }}
    >
      <DraftStatusBanner
        status={persistStatus}
        guestDraft={Boolean(guestDraft)}
        onAdoptGuest={adoptGuestDraft}
        onDiscardGuest={discardGuestDraft}
        onKeepLocal={keepLocalCopy}
        onUseServer={clearResumeDraft}
      />
      {children}
    </ResumeContext.Provider>
  );
}

export const ResumeProvider = ({
  children,
  resumeId = 'new',
}: PropsWithChildren<{ resumeId?: string }>) => {
  const { session, isPending } = useUserSession();
  const storage = useMemo(() => browserStorage(), []);

  if (isPending) {
    return <Loading message="Restoring resume draft..." />;
  }

  const owner: DraftOwner | null = session?.user
    ? { kind: 'user', userId: session.user.id }
    : (() => {
      const guestId = getOrCreateGuestId(storage);
      return guestId ? { kind: 'guest', guestId } : null;
    })();

  if (!owner) {
    return (
      <>
        <DraftStatusBanner status="unavailable" />
        <ResumeMachine owner={{ kind: 'guest', guestId: 'memory' }} documentId={resumeId}>
          {children}
        </ResumeMachine>
      </>
    );
  }

  return (
    <ResumeMachine
      key={`${owner.kind}:${owner.kind === 'user' ? owner.userId : owner.guestId}:${resumeId}`}
      owner={owner}
      documentId={resumeId}
    >
      {children}
    </ResumeMachine>
  );
};

export const useResumeContext = () => {
  const context = useContext(ResumeContext);

  if (!context) {
    throw new Error('useResumeContext must be used within a ResumeProvider');
  }

  return context;
};
