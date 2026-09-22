'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMachine } from '@xstate/react';
import { createContext, PropsWithChildren, useContext, useEffect } from 'react';
import { ActorRef, AnyActorRef, MachineSnapshot, Snapshot, StateSchema } from 'xstate';
import { AccountContext, AccountEvents, AccountState, MetaKey } from '../state/types';
import { accountState } from '../state/machine';
import { accountSnapshotStorageKey } from '../state/storage';
import { useUserSession } from '@lib/providers';

type State = MachineSnapshot<
  AccountContext,
  AccountEvents,
  Record<string, AnyActorRef | undefined>,
  AccountState,
  string,
  unknown,
  Record<MetaKey, any>,
  StateSchema
>;

type ContextState = {
  userId: string;
  state: State;
  actorRef: ActorRef<Snapshot<State>, AccountEvents>;
  send: (event: AccountEvents) => void;
};

function getSnapshot(userId: string) {
  if (typeof window !== 'undefined') {
    const snapshot = localStorage.getItem(accountSnapshotStorageKey(userId));
    return snapshot ? JSON.parse(snapshot) : undefined;
  }

  return undefined;
}

const MachineContext = createContext<ContextState>({} as ContextState);

const PersistState = ({ children, userId }: PropsWithChildren<{ userId: string }>) => {
  const { actorRef } = useAccountContext();

  useEffect(() => {
    const subscription = actorRef.subscribe((snapshot) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(accountSnapshotStorageKey(userId), JSON.stringify(snapshot));
      }
    });

    return subscription.unsubscribe;
  }, [actorRef, userId]);

  return children;
};

export const AccountProvider = ({ children }: PropsWithChildren) => {
  const { session } = useUserSession();

  if (!session || !session.user) {
    throw new Error('User not found');
  }

  const { user } = session;

  const [state, send, actorRef] = useMachine(accountState, { snapshot: getSnapshot(user.id) });

  return (
    // @ts-expect-error - TODO: fix this
    <MachineContext.Provider value={{ state, actorRef, userId: user.id, send }}>
      <PersistState userId={user.id}>{children}</PersistState>
    </MachineContext.Provider>
  );
};

export const useAccountContext = () => {
  const context = useContext(MachineContext);

  if (!context) {
    throw new Error('useMachineContext must be used within a AccountProvider');
  }

  return context;
};
