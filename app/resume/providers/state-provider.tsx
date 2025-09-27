'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMachine } from '@xstate/react';
import { createContext, PropsWithChildren, useContext, useEffect } from 'react';
import { ActorRef, AnyActorRef, MachineSnapshot, Snapshot, StateSchema } from 'xstate';
import { ResumeContext, ResumeEvents, MetaKey, ResumeState } from '../state/types';
import { resumeState } from '../state/machine';

type State = MachineSnapshot<
  ResumeContext,
  ResumeEvents,
  Record<string, AnyActorRef | undefined>,
  ResumeState,
  string,
  unknown,
  Record<MetaKey, any>,
  StateSchema
>;

type ContextState = {
  resumeId: string;
  state: State;
  actorRef: ActorRef<Snapshot<State>, ResumeEvents>;
  send: (event: ResumeEvents) => void;
};

export const RESUME_SNAPSHOT_KEY = 'resume-state-snapshot';

function getSnapshot(userId: string) {
  if (typeof window !== 'undefined') {
    const snapshot = localStorage.getItem(`${RESUME_SNAPSHOT_KEY}-${userId}`);
    return snapshot ? JSON.parse(snapshot) : undefined;
  }

  return undefined;
}

const MachineContext = createContext<ContextState>({} as ContextState);

const PersistState = ({ children, resumeId = 'new_resume' }: PropsWithChildren<{ resumeId?: string }>) => {
  const { actorRef } = useResumeContext();

  useEffect(() => {
    const subscription = actorRef.subscribe((snapshot) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${RESUME_SNAPSHOT_KEY}-${resumeId}`, JSON.stringify(snapshot));
      }
    });

    return subscription.unsubscribe;
  }, [actorRef, resumeId]);

  return children;
};

export const ResumeProvider = ({ children, resumeId = 'new_resume' }: PropsWithChildren<{ resumeId?: string }>) => {
  const [state, send, actorRef] = useMachine(resumeState, { snapshot: getSnapshot(resumeId) });

  return (
    // @ts-expect-error - TODO: fix this
    <MachineContext.Provider value={{ state, actorRef, send, resumeId }}>
      <PersistState resumeId={resumeId}>{children}</PersistState>
    </MachineContext.Provider>
  );
};

export const useResumeContext = () => {
  const context = useContext(MachineContext);

  if (!context) {
    throw new Error('useMachineContext must be used within a ResumeProvider');
  }

  return context;
};
