'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useLlmJob } from '@hooks/use-llm-job';

import {
  nextQuestionId,
  previousQuestionId,
  upsertAnswer,
  type OnboardingQuestion,
  type QuestionAnswer,
} from '@lib/ai-improve/questions';
import { resumeToCareerDocument } from '@lib/llm/career-document';
import { createLlmClient, type LlmClient } from '@lib/llm/client';
import { LLM_SCHEMA_VERSION, type SessionAnswer, type SourceRef } from '@lib/llm/contract';
import { LlmError } from '@lib/llm/errors';
import type { LlmJobState } from '@lib/llm/job-runner';
import { proposalFromEnvelope, reviewServiceProposal, type ServiceProposal } from '@lib/llm/improve-proposal';
import type { ResumeForm } from '@lib/types';

import type { AiImproveStep } from './use-ai-improve';

/*
 * Improve with AI on the LLM service (MDI-221), behind NEXT_PUBLIC_FLAG_LLM_SERVICE. It returns
 * the same shape as `useAiImprove`, so the overlay is shared:
 * 1. POST /sessions with the resume as a CareerDocument (one session per Improve with AI).
 * 2. A generate_questions job (round 1, up to five questions).
 * 3. Answers and skips go to POST /sessions/{id}/answers, which makes a new context revision.
 * 4. An improve_resume job on that revision returns a proposal, reviewed change by change.
 *
 * The session and the running job survive a reload. The proposal is checked against the current
 * document on every render: a change whose original text was edited since is dropped, so a later
 * edit is never overwritten. Ending the session deletes it on the service.
 */

/** The resume a session is about; an unsaved resume uses a client id. */
export type ImproveSource = {
  id: string;
  revision: string;
  resumeType?: 'general' | 'job_specific';
  sourceResumeId?: string | null;
};

type StoredSession = {
  v: 1;
  /** createSession's key, kept so a repeat after a lost answer returns the same session. */
  clientRequestId: string;
  source: SourceRef;
  sessionId: string | null;
  contextRevisionId: string | null;
  questionSetId: string | null;
  questions: OnboardingQuestion[] | null;
  answers: QuestionAnswer[];
  currentQuestionId: string | null;
  unsentAnswer: string;
  /** The answers already sent, so a retry does not send them again. */
  answersSent: string | null;
  proposal: ServiceProposal | null;
  /** The stage of the job that is running, so a reload shows the right wait. */
  running: 'questions' | 'proposal' | null;
};

type Failure = { stage: 'questions' | 'proposal'; message: string };

type Options = {
  resume: ResumeForm;
  /** Where the session is kept; null turns the hook off. */
  storageKey: string | null;
  source: ImproveSource | null;
  locale?: string;
  onApply: (resume: ResumeForm) => void;
  client?: LlmClient;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STORE_PREFIX = 'talvio-llm-improve:v1:';

function newKey(): string {
  return crypto.randomUUID();
}

function readStored(key: string | null): StoredSession | null {
  if (!key || typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(`${STORE_PREFIX}${key}`);
    const parsed = raw ? (JSON.parse(raw) as StoredSession) : null;
    return parsed?.v === 1 ? parsed : null;
  } catch {
    return null;
  }
}

function writeStored(key: string | null, value: StoredSession | null) {
  if (!key || typeof window === 'undefined') {
    return;
  }
  try {
    if (value) {
      window.localStorage.setItem(`${STORE_PREFIX}${key}`, JSON.stringify(value));
    } else {
      window.localStorage.removeItem(`${STORE_PREFIX}${key}`);
    }
  } catch {
    // Quota or private mode: the session lives in memory only.
  }
}

function sourceRef(source: ImproveSource | null): SourceRef {
  const id = source && UUID.test(source.id) ? source.id : newKey();
  return {
    kind: 'resume',
    id,
    revision: source && UUID.test(source.id) ? source.revision.slice(0, 64) || 'unsaved' : 'unsaved',
    resumeType: source?.resumeType ?? 'general',
    state: 'draft',
    sourceResumeId: source?.sourceResumeId ?? null,
  };
}

/** A stored session shows again on load once it has questions or a running job to wait for. */
function reopens(stored: StoredSession | null): boolean {
  return Boolean(stored && (stored.questions || stored.running));
}

function stepFor(stored: StoredSession): AiImproveStep {
  if (stored.proposal) {
    return 'proposalReview';
  }
  if (!stored.questions) {
    return 'loadingQuestions';
  }
  return stored.currentQuestionId ? 'questions' : 'answerReview';
}

function sessionAnswers(answers: QuestionAnswer[]): SessionAnswer[] {
  return answers.flatMap((answer): SessionAnswer[] => {
    if (answer.status === 'skipped') {
      return [{ questionId: answer.questionId, status: 'skipped' }];
    }
    const value = answer.value.trim().slice(0, 2_000);
    return value ? [{ questionId: answer.questionId, status: 'answered', value }] : [{ questionId: answer.questionId, status: 'skipped' }];
  });
}

function questionsFrom(result: unknown): { questionSetId: string; questions: OnboardingQuestion[] } | null {
  const set = result as { questionSetId?: unknown; questions?: unknown } | null;
  if (!set || typeof set.questionSetId !== 'string' || !Array.isArray(set.questions)) {
    return null;
  }
  const questions = set.questions.flatMap((item): OnboardingQuestion[] => {
    const question = item as { id?: unknown; prompt?: unknown; guidance?: unknown; reason?: unknown };
    if (typeof question.id !== 'string' || typeof question.prompt !== 'string') {
      return [];
    }
    const guidance = typeof question.guidance === 'string' && question.guidance ? question.guidance : null;
    const reason = typeof question.reason === 'string' ? question.reason : '';
    return [{ id: question.id, question: question.prompt, example: guidance ?? reason }];
  });
  return { questionSetId: set.questionSetId, questions };
}

export function useServiceImprove({ resume, storageKey, source, locale = 'en-US', onApply, client }: Options) {
  const llm = useMemo(() => client ?? createLlmClient(), [client]);
  const [stored, setStored] = useState<StoredSession | null>(() => readStored(storageKey));
  const [seenKey, setSeenKey] = useState(storageKey);
  // A stored session reopens where it was, like the legacy flow.
  const [visible, setVisible] = useState(() => reopens(stored));
  const [pending, setPending] = useState<'questions' | 'proposal' | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [cap, setCap] = useState<{ message: string; resetAt: Date } | null>(null);
  const [confirmed, setConfirmed] = useState<ReadonlySet<string>>(() => new Set());
  const storedRef = useRef(stored);
  const resumeRef = useRef(resume);


  // The key can arrive after the first render (the auth session loads late on /resume).
  if (seenKey !== storageKey) {
    setSeenKey(storageKey);
    const next = readStored(storageKey);
    setStored(next);
    setVisible(reopens(next));
  }

  useEffect(() => {
    storedRef.current = stored;
    resumeRef.current = resume;
  });

  const persist = useCallback((next: StoredSession | null) => {
    storedRef.current = next;
    setStored(next);
    writeStored(storageKey, next);
  }, [storageKey]);

  const fail = useCallback((stage: Failure['stage'], error: unknown) => {
    setPending(null);
    if (error instanceof LlmError && error.uiState === 'capped') {
      setCap({ message: error.message, resetAt: error.retryAt ?? new Date(Date.now() + 86_400_000) });
      return;
    }
    if (error instanceof LlmError && (error.uiState === 'expired' || error.uiState === 'stale')) {
      // The service no longer has this session or its context: Retry starts a new one.
      persist(null);
      setFailure({ stage: 'questions', message: 'This session ended. Start again to get new questions.' });
      return;
    }
    setFailure({ stage, message: error instanceof Error ? error.message : 'Something went wrong' });
  }, [persist]);

  // A finished job moves the session on; a failed one shows why. Called by the job runner.
  const onSettled = useCallback((settled: Extract<LlmJobState, { phase: 'succeeded' | 'failed' }>, clear: () => void) => {
    const session = storedRef.current;
    if (!session) {
      return;
    }
    const stage = session.running ?? 'questions';
    if (settled.phase === 'failed') {
      persist({ ...session, running: null });
      fail(stage, settled.error);
      return;
    }
    if (stage === 'questions') {
      const set = questionsFrom(settled.result.result);
      if (set) {
        persist({
          ...session,
          running: null,
          questionSetId: set.questionSetId,
          questions: set.questions,
          answers: [],
          currentQuestionId: set.questions[0]?.id ?? null,
          unsentAnswer: '',
        });
      } else {
        persist({ ...session, running: null });
        setFailure({ stage, message: 'The questions could not be read. Try again.' });
      }
    } else {
      const proposal = proposalFromEnvelope(settled.result);
      persist({ ...session, running: null, proposal: proposal ?? session.proposal });
      if (proposal) {
        setConfirmed(new Set());
      } else {
        setFailure({ stage, message: 'The suggestions could not be read. Try again.' });
      }
    }
    // The result is stored: forget the finished job.
    clear();
  }, [fail, persist]);

  const job = useLlmJob({
    storageKey: storageKey ? `talvio-llm-job:v1:improve:${storageKey}` : null,
    client: llm,
    onSettled,
  });
  const runQuestions = useCallback(async (session: StoredSession) => {
    setFailure(null);
    setPending('questions');
    try {
      let current = session;
      if (!current.sessionId || !current.contextRevisionId) {
        const { document } = resumeToCareerDocument(resumeRef.current);
        const created = await llm.createSession({
          schemaVersion: LLM_SCHEMA_VERSION,
          clientRequestId: current.clientRequestId,
          purpose: 'improve',
          source: { source: current.source, document },
          jobDescription: null,
        });
        current = { ...current, sessionId: created.sessionId, contextRevisionId: created.latestContext.contextRevisionId };
      }
      persist({ ...current, running: 'questions' });
      setPending(null);
      job.start({
        operation: 'generate_questions',
        locale,
        sessionId: current.sessionId as string,
        contextRevisionId: current.contextRevisionId as string,
        parentJobId: null,
        input: { analysisJobId: null, round: 1, maxQuestions: 5 },
      });
    } catch (error) {
      fail('questions', error);
    }
  }, [fail, job, llm, locale, persist]);

  const runProposal = useCallback(async () => {
    const session = storedRef.current;
    if (!session?.sessionId || !session.contextRevisionId) {
      return;
    }
    setFailure(null);
    setPending('proposal');
    try {
      let current = session;
      const answers = sessionAnswers(current.answers);
      const signature = JSON.stringify(answers);
      if (answers.length && current.questionSetId && current.answersSent !== signature) {
        const revision = await llm.submitAnswers(current.sessionId as string, {
          baseContextRevisionId: current.contextRevisionId as string,
          questionSetId: current.questionSetId,
          answers,
        });
        current = { ...current, contextRevisionId: revision.contextRevisionId, answersSent: signature };
      }
      persist({ ...current, running: 'proposal', proposal: null });
      setPending(null);
      job.start({
        operation: 'improve_resume',
        locale,
        sessionId: current.sessionId as string,
        contextRevisionId: current.contextRevisionId as string,
        parentJobId: null,
        input: { sections: [], targetRole: null },
      });
    } catch (error) {
      fail('proposal', error);
    }
  }, [fail, job, llm, locale, persist]);

  const start = useCallback(() => {
    setCap(null);
    setVisible(true);
    const session = storedRef.current;
    if (session) {
      if (!session.questions && !session.running && !pending) {
        void runQuestions(session);
      }
      return;
    }
    const created: StoredSession = {
      v: 1,
      clientRequestId: newKey(),
      source: sourceRef(source),
      sessionId: null,
      contextRevisionId: null,
      questionSetId: null,
      questions: null,
      answers: [],
      currentQuestionId: null,
      unsentAnswer: '',
      answersSent: null,
      proposal: null,
      running: null,
    };
    persist(created);
    void runQuestions(created);
  }, [pending, persist, runQuestions, source]);

  const setUnsentAnswer = useCallback((unsentAnswer: string) => {
    const session = storedRef.current;
    if (session) {
      persist({ ...session, unsentAnswer });
    }
  }, [persist]);

  const answerCurrent = useCallback((status: 'answered' | 'skipped') => {
    const session = storedRef.current;
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
  }, [persist]);

  const goToPreviousQuestion = useCallback(() => {
    const session = storedRef.current;
    if (!session?.questions) {
      return;
    }
    const current = session.currentQuestionId;
    const previousId = current ? previousQuestionId(session.questions, current) : session.questions.at(-1)?.id ?? null;
    if (previousId) {
      persist({
        ...session,
        currentQuestionId: previousId,
        unsentAnswer: session.answers.find((answer) => answer.questionId === previousId)?.value ?? '',
      });
    }
  }, [persist]);

  const proposal = stored?.proposal ?? null;
  const review = useMemo(
    () => (proposal ? reviewServiceProposal(resume, proposal, confirmed) : null),
    [confirmed, proposal, resume],
  );

  const end = useCallback(() => {
    const session = storedRef.current;
    if (job.busy) {
      job.cancel();
    } else {
      job.clear();
    }
    if (session?.sessionId) {
      // Best effort: the service also expires sessions after seven days.
      void llm.deleteSession(session.sessionId).catch(() => undefined);
    }
    persist(null);
    setPending(null);
    setFailure(null);
    setCap(null);
    setConfirmed(new Set());
    setVisible(false);
  }, [job, llm, persist]);

  const accept = useCallback(() => {
    if (review && review.resume !== resumeRef.current) {
      onApply(review.resume);
    }
    end();
  }, [end, onApply, review]);

  const close = useCallback(() => {
    setFailure(null);
    setVisible(false);
  }, []);

  const retry = useCallback(() => {
    const stage = failure?.stage;
    const session = storedRef.current;
    setFailure(null);
    if (job.state.phase === 'failed' && job.state.error.retryable && session) {
      persist({ ...session, running: stage ?? 'questions' });
      job.retry();
      return;
    }
    job.clear();
    if (stage === 'proposal') {
      void runProposal();
      return;
    }
    if (session) {
      void runQuestions(session);
    } else {
      start();
    }
  }, [failure?.stage, job, persist, runProposal, runQuestions, start]);

  const toggleConfirmed = useCallback((changeId: string) => {
    setConfirmed((current) => {
      const next = new Set(current);
      if (next.has(changeId)) {
        next.delete(changeId);
      } else {
        next.add(changeId);
      }
      return next;
    });
  }, []);

  let step: AiImproveStep = 'idle';
  if (visible && storageKey) {
    if (cap) {
      step = 'capped';
    } else if (failure) {
      step = 'error';
    } else if (pending === 'proposal' || stored?.running === 'proposal') {
      step = 'loadingProposal';
    } else if (pending === 'questions' || stored?.running === 'questions' || !stored) {
      step = 'loadingQuestions';
    } else {
      step = stepFor(stored);
    }
  }

  return {
    step,
    active: step !== 'idle',
    busy: step === 'loadingQuestions' || step === 'loadingProposal',
    questions: stored?.questions ?? [],
    answers: stored?.answers ?? [],
    currentQuestionId: stored?.currentQuestionId ?? null,
    unsentAnswer: stored?.unsentAnswer ?? '',
    writingVoiceVersion: null,
    review,
    failure,
    cap,
    notice: null,

    confirmed,
    toggleConfirmed,
    start,
    setUnsentAnswer,
    answerCurrent,
    goToPreviousQuestion,
    requestProposal: () => void runProposal(),
    accept,
    reject: end,
    cancel: end,
    close,
    retry,
  };
}
