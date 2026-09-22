'use client';
import { useMachine } from '@xstate/react';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { resumeState } from '../state/machine';
import { Loading } from '@components/views';
import { DraftStatusBanner } from '@components/views/draft-status';
import {
  adoptDraft,
  browserStorage,
  buildResumeDraft,
  clearDraft,
  copyDraftForRecovery,
  createDebouncedWriter,
  getOrCreateGuestId,
  readParsedResumeDraft,
  restoreResumeDraft,
  resumeDraftStorageKey,
  resumeProgressFromState,
  writeDraft,
  type DraftOwner,
  type DraftPersistStatus,
  type VersionedDraft,
} from '@lib/drafts';
import { useUserSession } from '@lib/providers';

type ResumeMachine = ReturnType<typeof useMachine<typeof resumeState>>;

type ContextState = {
  resumeId: string;
  state: ResumeMachine[0];
  actorRef: ResumeMachine[2];
  send: ResumeMachine[1];
  persistStatus: DraftPersistStatus;
  guestDraft: VersionedDraft | null;
  adoptGuestDraft: () => void;
  discardGuestDraft: () => void;
  clearResumeDraft: () => void;
};

const MachineContext = createContext<ContextState>({} as ContextState);

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
  const initialRead = useMemo(() => readParsedResumeDraft(storage, key), [key, storage]);
  const guestRead = useMemo(
    () => (guestKey ? readParsedResumeDraft(storage, guestKey) : { draft: null, parsed: null, status: 'ok' as const }),
    [guestKey, storage],
  );
  const [persistStatus, setPersistStatus] = useState<DraftPersistStatus>(initialRead.status);
  const [guestDraft, setGuestDraft] = useState<VersionedDraft | null>(
    owner.kind === 'user' && !initialRead.parsed ? guestRead.parsed ? guestRead.draft : null : null,
  );
  const draftRef = useRef<VersionedDraft | null>(initialRead.parsed ? initialRead.draft : null);
  const lastStepRef = useRef<string | undefined>(undefined);
  const hydratedRef = useRef(false);
  const [state, send, actorRef] = useMachine(resumeState);

  const persistCurrent = (nextDraft: VersionedDraft | null) => {
    draftRef.current = nextDraft;
    if (!nextDraft) {
      setPersistStatus(clearDraft(storage, key));
      return;
    }
    setPersistStatus(writeDraft(storage, key, nextDraft));
  };

  const clearResumeDraft = () => persistCurrent(null);

  const adoptGuestDraft = () => {
    if (!guestDraft) {
      return;
    }
    const adopted = adoptDraft(guestDraft, owner);
    persistCurrent(adopted);
    if (guestKey) {
      clearDraft(storage, guestKey);
    }
    setGuestDraft(null);
    restoreResumeDraft(send, adopted);
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
    persistCurrent(copyDraftForRecovery(draftRef.current));
    setPersistStatus('ok');
  };

  useEffect(() => {
    if (hydratedRef.current) {
      return;
    }
    if (initialRead.parsed && initialRead.draft) {
      restoreResumeDraft(send, initialRead.draft);
    }
    hydratedRef.current = true;
  }, [initialRead.draft, initialRead.parsed, send]);

  useEffect(() => {
    const writer = createDebouncedWriter((draft: VersionedDraft | null) => {
      persistCurrent(draft);
    });

    const subscription = actorRef.subscribe((next) => {
      if (!hydratedRef.current) {
        return;
      }
      const nextDraft = buildResumeDraft({
        owner,
        context: next.context,
        stateValue: next.value,
        existing: draftRef.current,
        documentId,
      });
      if (!nextDraft) {
        return;
      }
      const step = resumeProgressFromState(next.value)?.step;
      const stepChanged = lastStepRef.current !== undefined && lastStepRef.current !== step;
      lastStepRef.current = step;
      draftRef.current = nextDraft;
      writer.schedule(nextDraft);
      if (stepChanged) {
        writer.flush();
      }
    });

    const flush = () => writer.flush();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        flush();
      }
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      subscription.unsubscribe();
      flush();
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // persistCurrent closes over the latest key/storage for this mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actorRef, documentId, key, owner, storage]);

  return (
    <MachineContext.Provider
      value={{
        state,
        actorRef,
        send,
        resumeId: documentId,
        persistStatus,
        guestDraft,
        adoptGuestDraft,
        discardGuestDraft,
        clearResumeDraft,
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
    </MachineContext.Provider>
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
  const context = useContext(MachineContext);

  if (!context) {
    throw new Error('useMachineContext must be used within a ResumeProvider');
  }

  return context;
};
