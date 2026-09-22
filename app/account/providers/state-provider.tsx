'use client';
import { useMachine } from '@xstate/react';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { accountState } from '../state/machine';
import { Loading } from '@components/views';
import { DraftStatusBanner } from '@components/views/draft-status';
import {
  accountDraftStorageKey,
  accountProgressFromState,
  browserStorage,
  buildAccountDraft,
  clearDraft,
  createDebouncedWriter,
  readParsedAccountDraft,
  restoreAccountDraft,
  writeDraft,
  type DraftOwner,
  type DraftPersistStatus,
  type VersionedDraft,
} from '@lib/drafts';
import { useUserSession } from '@lib/providers';

type AccountMachine = ReturnType<typeof useMachine<typeof accountState>>;

type ContextState = {
  userId: string;
  state: AccountMachine[0];
  actorRef: AccountMachine[2];
  send: AccountMachine[1];
  persistStatus: DraftPersistStatus;
  clearAccountDraft: () => void;
};

const MachineContext = createContext<ContextState>({} as ContextState);

function AccountMachine({ children, userId }: PropsWithChildren<{ userId: string }>) {
  const owner = useMemo<DraftOwner>(() => ({ kind: 'user', userId }), [userId]);
  const storage = useMemo(() => browserStorage(), []);
  const key = accountDraftStorageKey({ kind: 'user', userId });
  const initialRead = useMemo(() => readParsedAccountDraft(storage, key), [key, storage]);
  const [persistStatus, setPersistStatus] = useState<DraftPersistStatus>(initialRead.status);
  const draftRef = useRef<VersionedDraft | null>(initialRead.parsed ? initialRead.draft : null);
  const lastStepRef = useRef<string | undefined>(undefined);
  const hydratedRef = useRef(false);
  const [state, send, actorRef] = useMachine(accountState);

  const clearAccountDraft = () => {
    draftRef.current = null;
    setPersistStatus(clearDraft(storage, key));
  };

  useEffect(() => {
    if (hydratedRef.current) {
      return;
    }
    if (initialRead.parsed) {
      restoreAccountDraft(send, initialRead.parsed.content, initialRead.parsed.progress);
    }
    hydratedRef.current = true;
  }, [initialRead.parsed, send]);

  useEffect(() => {
    const writer = createDebouncedWriter((draft: VersionedDraft | null) => {
      if (!draft) {
        setPersistStatus(clearDraft(storage, key));
        return;
      }
      setPersistStatus(writeDraft(storage, key, draft));
    });

    const subscription = actorRef.subscribe((next) => {
      if (!hydratedRef.current) {
        return;
      }
      if (next.matches('existingAccount')) {
        draftRef.current = null;
        writer.schedule(null);
        writer.flush();
        return;
      }
      const nextDraft = buildAccountDraft({
        owner,
        context: next.context,
        stateValue: next.value,
        existing: draftRef.current,
      });
      if (!nextDraft) {
        return;
      }
      const step = accountProgressFromState(next.value)?.step;
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
  }, [actorRef, key, owner, storage]);

  return (
    <MachineContext.Provider value={{ state, actorRef, userId, send, persistStatus, clearAccountDraft }}>
      <DraftStatusBanner status={persistStatus} />
      {children}
    </MachineContext.Provider>
  );
}

export const AccountProvider = ({ children }: PropsWithChildren) => {
  const { session, isPending } = useUserSession();

  if (isPending) {
    return <Loading message="Restoring account draft..." />;
  }

  if (!session?.user) {
    throw new Error('User not found');
  }

  return <AccountMachine userId={session.user.id}>{children}</AccountMachine>;
};

export const useAccountContext = () => {
  const context = useContext(MachineContext);

  if (!context) {
    throw new Error('useMachineContext must be used within a AccountProvider');
  }

  return context;
};
