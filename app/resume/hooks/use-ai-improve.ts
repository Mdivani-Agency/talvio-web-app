'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AiCapError } from '@lib/ai-cap';
import {
  applyAiProposal,
  documentHash,
  documentToAiPayload,
  type AiProposalResult,
} from '@lib/ai-improve/payload';
import {
  assignQuestionIds,
  nextQuestionId,
  previousQuestionId,
  tailorPayload,
  upsertAnswer,
} from '@lib/ai-improve/questions';
import { fetchAccountProposal, fetchQuestions } from '@lib/clients/llm.client';
import {
  browserStorage,
  readAiImproveSession,
  writeAiImproveSession,
  type AiImproveSession,
} from '@lib/drafts';
import type { DeepPartial, AccountDto, ResumeForm } from '@lib/types';

export type AiImproveStep =
  | 'idle'
  | 'loadingQuestions'
  | 'questions'
  | 'answerReview'
  | 'loadingProposal'
  | 'proposalReview'
  | 'error'
  | 'capped';

type Failure = {
  stage: 'questions' | 'proposal';
  message: string;
};

type UseAiImproveOptions = {
  resume: ResumeForm;
  /** Where the session is kept; null keeps it in memory only. */
  storageKey: string | null;
  /** Receives the accepted document. */
  onApply: (resume: ResumeForm) => void;
};

function stepForSession(session: AiImproveSession): AiImproveStep {
  if (session.proposal) {
    return 'proposalReview';
  }
  return session.currentQuestionId ? 'questions' : 'answerReview';
}

/**
 * Improve with AI for one resume document (MDI-426): questions (`/api/resume/qa`), answers, then a
 * proposal (`/api/resume/account`) that Accept writes into the document. At most two AI requests per
 * session. The session is stored per document hash, so an edited document drops a stale proposal.
 */
export function useAiImprove({ resume, storageKey, onApply }: UseAiImproveOptions) {
  const storage = useMemo(() => browserStorage(), []);
  const hash = useMemo(() => documentHash(resume), [resume]);
  const [session, setSession] = useState<AiImproveSession | null>(() => (
    storageKey ? readAiImproveSession(storage, storageKey, hash) : null
  ));
  const [step, setStep] = useState<AiImproveStep>(() => (session ? stepForSession(session) : 'idle'));
  const [failure, setFailure] = useState<Failure | null>(null);
  const [cap, setCap] = useState<{ message: string; resetAt: Date } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [seenHash, setSeenHash] = useState(hash);
  const [seenKey, setSeenKey] = useState(storageKey);

  // The key can arrive after the first render (the auth session loads late on /resume): read it then.
  if (seenKey !== storageKey) {
    setSeenKey(storageKey);
    const stored = storageKey ? readAiImproveSession(storage, storageKey, hash) : null;
    setSession(stored);
    setStep(stored ? stepForSession(stored) : 'idle');
  }
  const requestRef = useRef(0);
  const hashRef = useRef(hash);

  // A document change keeps the answers (they describe the person) but makes any proposal stale.
  // Adjusted during render so the stale proposal never shows; the next session write stores it.
  if (seenHash !== hash) {
    setSeenHash(hash);
    if (session && session.proposalFor !== hash) {
      setSession({ ...session, proposal: null, writingVoiceVersion: null, proposalFor: hash });
      if (step === 'proposalReview' || step === 'loadingProposal') {
        setNotice('Your resume changed, so the suggestions were dropped. Ask again to get new ones.');
        setStep('answerReview');
      }
    }
  }

  useEffect(() => {
    hashRef.current = hash;
  }, [hash]);

  const persist = useCallback((next: AiImproveSession | null) => {
    setSession(next);
  }, []);

  // Storage follows the session, including the stale-proposal reset made during render.
  useEffect(() => {
    if (storageKey) {
      writeAiImproveSession(storage, storageKey, session);
    }
  }, [session, storage, storageKey]);

  const fail = useCallback((stage: Failure['stage'], error: unknown) => {
    if (error instanceof AiCapError) {
      setCap({ message: error.message, resetAt: error.resetAt });
      setStep('capped');
      return;
    }
    setFailure({ stage, message: error instanceof Error ? error.message : 'Something went wrong' });
    setStep('error');
  }, []);

  const loadQuestions = useCallback(async () => {
    const request = ++requestRef.current;
    const forHash = hashRef.current;
    setFailure(null);
    setNotice(null);
    setStep('loadingQuestions');
    try {
      const raw = await fetchQuestions(JSON.stringify(documentToAiPayload(resume)));
      if (request !== requestRef.current) {
        return;
      }
      const questions = assignQuestionIds(raw ?? []);
      persist({
        questions,
        answers: [],
        currentQuestionId: questions[0]?.id ?? null,
        unsentAnswer: '',
        proposal: null,
        writingVoiceVersion: null,
        proposalFor: forHash,
      });
      setStep(questions.length ? 'questions' : 'answerReview');
    } catch (error) {
      if (request === requestRef.current) {
        fail('questions', error);
      }
    }
  }, [fail, persist, resume]);

  const start = useCallback(() => {
    setCap(null);
    if (session) {
      setNotice(null);
      setStep(stepForSession(session));
      return;
    }
    void loadQuestions();
  }, [loadQuestions, session]);

  const setUnsentAnswer = useCallback((unsentAnswer: string) => {
    if (session) {
      persist({ ...session, unsentAnswer });
    }
  }, [persist, session]);

  const answerCurrent = useCallback((status: 'answered' | 'skipped') => {
    if (!session?.questions || !session.currentQuestionId) {
      return;
    }
    const answers = upsertAnswer(session.answers, {
      questionId: session.currentQuestionId,
      status,
      value: status === 'skipped' ? '' : session.unsentAnswer,
    });
    const nextId = nextQuestionId(session.questions, session.currentQuestionId);
    persist({
      ...session,
      answers,
      currentQuestionId: nextId,
      unsentAnswer: nextId ? answers.find((answer) => answer.questionId === nextId)?.value ?? '' : '',
    });
    setStep(nextId ? 'questions' : 'answerReview');
  }, [persist, session]);

  const goToPreviousQuestion = useCallback(() => {
    if (!session?.questions) {
      return;
    }
    const current = session.currentQuestionId ?? null;
    const previousId = current
      ? previousQuestionId(session.questions, current)
      : session.questions.at(-1)?.id ?? null;
    if (!previousId) {
      return;
    }
    persist({
      ...session,
      currentQuestionId: previousId,
      unsentAnswer: session.answers.find((answer) => answer.questionId === previousId)?.value ?? '',
    });
    setStep('questions');
  }, [persist, session]);

  const requestProposal = useCallback(async () => {
    if (!session) {
      return;
    }
    const request = ++requestRef.current;
    const forHash = hashRef.current;
    setFailure(null);
    setNotice(null);
    setStep('loadingProposal');
    try {
      const { questions, answers } = tailorPayload(session.questions ?? [], session.answers);
      const result = await fetchAccountProposal(
        JSON.stringify(documentToAiPayload(resume)),
        questions,
        answers,
      );
      if (request !== requestRef.current) {
        return;
      }
      if (forHash !== hashRef.current) {
        setNotice('Your resume changed, so the suggestions were dropped. Ask again to get new ones.');
        setStep('answerReview');
        return;
      }
      persist({
        ...session,
        proposal: result.account as Record<string, unknown>,
        writingVoiceVersion: result.writingVoiceVersion,
        proposalFor: forHash,
      });
      setStep('proposalReview');
    } catch (error) {
      if (request === requestRef.current) {
        fail('proposal', error);
      }
    }
  }, [fail, persist, resume, session]);

  const review: AiProposalResult | null = useMemo(() => {
    if (!session?.proposal || session.proposalFor !== hash) {
      return null;
    }
    return applyAiProposal(resume, documentToAiPayload(resume), session.proposal as DeepPartial<AccountDto>);
  }, [hash, resume, session]);

  const end = useCallback(() => {
    requestRef.current += 1;
    persist(null);
    setFailure(null);
    setCap(null);
    setNotice(null);
    setStep('idle');
  }, [persist]);

  const accept = useCallback(() => {
    if (review && review.resume !== resume) {
      onApply(review.resume);
    }
    end();
  }, [end, onApply, resume, review]);

  /** Hides the overlay and keeps the session for the next Improve with AI (cap, Close). */
  const close = useCallback(() => {
    requestRef.current += 1;
    setFailure(null);
    setStep('idle');
  }, []);

  const retry = useCallback(() => {
    if (failure?.stage === 'proposal') {
      void requestProposal();
      return;
    }
    void loadQuestions();
  }, [failure?.stage, loadQuestions, requestProposal]);

  return {
    step,
    active: step !== 'idle',
    busy: step === 'loadingQuestions' || step === 'loadingProposal',
    questions: session?.questions ?? [],
    answers: session?.answers ?? [],
    currentQuestionId: session?.currentQuestionId ?? null,
    unsentAnswer: session?.unsentAnswer ?? '',
    writingVoiceVersion: session?.writingVoiceVersion ?? null,
    review,
    failure,
    cap,
    notice,
    start,
    setUnsentAnswer,
    answerCurrent,
    goToPreviousQuestion,
    requestProposal: () => void requestProposal(),
    accept,
    reject: end,
    cancel: end,
    close,
    retry,
  };
}

export type AiImprove = ReturnType<typeof useAiImprove>;
