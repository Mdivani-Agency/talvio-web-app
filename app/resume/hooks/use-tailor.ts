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
import { reviewTailoring, tailorResultFromEnvelope, type TailorResult } from '@lib/llm/tailor';
import type { PreviewDto, ResumeForm } from '@lib/types';

/*
 * Tailor a resume to a job post on the LLM service (MDI-221), behind NEXT_PUBLIC_FLAG_LLM_SERVICE:
 * 1. A `tailor` session with the source (the profile or a saved resume) and the job post.
 * 2. A generate_questions job asks about gaps between the two; answers go to /answers once.
 * 3. A tailor_resume job composes the resume as changes and omissions, with requirement coverage.
 * 4. The user confirms new facts, keeps any omitted content they want, and creates a new
 *    JOB_SPECIFIC resume. The source itself is never changed.
 *
 * The journey and its running job survive a reload (stored per user).
 */

export type TailorStep =
  | 'intake'
  | 'loadingQuestions'
  | 'questions'
  | 'answerReview'
  | 'loadingProposal'
  | 'review'
  | 'error'
  | 'capped';

export type TailorJobPost = { text: string; title: string | null; company: string | null };

export type TailorStart = {
  source: SourceRef;
  /** The source as a resume document; the tailored resume is built from it. */
  document: ResumeForm;
  /** Template, color and font for the new resume. */
  look: Pick<PreviewDto, 'template' | 'color' | 'fontSize' | 'fontFamily'>;
  jobPost: TailorJobPost;
  resumeName: string;
};

type StoredTailor = TailorStart & {
  v: 1;
  clientRequestId: string;
  sessionId: string | null;
  contextRevisionId: string | null;
  questionSetId: string | null;
  questions: OnboardingQuestion[] | null;
  answers: QuestionAnswer[];
  currentQuestionId: string | null;
  unsentAnswer: string;
  answersSent: string | null;
  result: TailorResult | null;
  running: 'questions' | 'proposal' | null;
};

type Failure = { stage: 'questions' | 'proposal'; message: string };

const STORE_PREFIX = 'talvio-llm-tailor:v1:';

function read(key: string | null): StoredTailor | null {
  if (!key || typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(`${STORE_PREFIX}${key}`);
    const parsed = raw ? (JSON.parse(raw) as StoredTailor) : null;
    return parsed?.v === 1 ? parsed : null;
  } catch {
    return null;
  }
}

function write(key: string | null, value: StoredTailor | null) {
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
    // Quota or private mode: the journey lives in memory only.
  }
}

function sessionAnswers(answers: QuestionAnswer[]): SessionAnswer[] {
  return answers.map((answer): SessionAnswer => {
    const value = answer.value.trim().slice(0, 2_000);
    return answer.status === 'answered' && value
      ? { questionId: answer.questionId, status: 'answered', value }
      : { questionId: answer.questionId, status: 'skipped' };
  });
}

function questionsFrom(result: unknown): { questionSetId: string; questions: OnboardingQuestion[] } | null {
  const set = result as { questionSetId?: unknown; questions?: unknown } | null;
  if (!set || typeof set.questionSetId !== 'string' || !Array.isArray(set.questions)) {
    return null;
  }
  return {
    questionSetId: set.questionSetId,
    questions: set.questions.flatMap((item): OnboardingQuestion[] => {
      const question = item as { id?: unknown; prompt?: unknown; guidance?: unknown; reason?: unknown };
      if (typeof question.id !== 'string' || typeof question.prompt !== 'string') {
        return [];
      }
      const guidance = typeof question.guidance === 'string' && question.guidance ? question.guidance : null;
      return [{ id: question.id, question: question.prompt, example: guidance ?? (typeof question.reason === 'string' ? question.reason : '') }];
    }),
  };
}

type Options = {
  /** Per user; null turns the journey off (guests sign in first). */
  storageKey: string | null;
  locale?: string;
  client?: LlmClient;
};

export function useTailor({ storageKey, locale = 'en-US', client }: Options) {
  const llm = useMemo(() => client ?? createLlmClient(), [client]);
  const [stored, setStored] = useState<StoredTailor | null>(() => read(storageKey));
  const [seenKey, setSeenKey] = useState(storageKey);
  const [pending, setPending] = useState<'questions' | 'proposal' | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [cap, setCap] = useState<{ message: string } | null>(null);
  const [confirmed, setConfirmed] = useState<ReadonlySet<string>>(() => new Set());
  const [kept, setKept] = useState<ReadonlySet<string>>(() => new Set());
  const storedRef = useRef(stored);

  // The key arrives after the first render on a reload (the auth session loads late).
  if (seenKey !== storageKey) {
    setSeenKey(storageKey);
    setStored(read(storageKey));
  }

  useEffect(() => {
    storedRef.current = stored;
  });

  const persist = useCallback((next: StoredTailor | null) => {
    storedRef.current = next;
    setStored(next);
    write(storageKey, next);
  }, [storageKey]);

  const fail = useCallback((stage: Failure['stage'], error: unknown) => {
    setPending(null);
    if (error instanceof LlmError && error.uiState === 'capped') {
      setCap({ message: error.message });
      return;
    }
    if (error instanceof LlmError && (error.uiState === 'expired' || error.uiState === 'stale')) {
      const session = storedRef.current;
      if (session) {
        // The service no longer has this session: Retry opens a new one with the same inputs.
        persist({ ...session, clientRequestId: crypto.randomUUID(), sessionId: null, contextRevisionId: null, questionSetId: null, questions: null, answersSent: null, result: null, running: null });
      }
      setFailure({ stage: 'questions', message: 'This session ended. Try again to start a new one.' });
      return;
    }
    setFailure({ stage, message: error instanceof Error ? error.message : 'Something went wrong' });
  }, [persist]);

  const onSettled = useCallback((settled: Extract<LlmJobState, { phase: 'succeeded' | 'failed' }>, clear: () => void) => {
    const session = storedRef.current;
    if (!session) {
      return;
    }
    const stage = session.running ?? 'questions';
    if (settled.phase === 'failed') {
      // `running` keeps the stage, so after a reload Retry still knows which job failed.
      fail(stage, settled.error);
      return;
    }
    if (stage === 'questions') {
      const set = questionsFrom(settled.result.result);
      persist({
        ...session,
        running: null,
        questionSetId: set?.questionSetId ?? null,
        questions: set?.questions ?? [],
        answers: [],
        currentQuestionId: set?.questions[0]?.id ?? null,
        unsentAnswer: '',
      });
      if (!set) {
        setFailure({ stage, message: 'The questions could not be read. Try again.' });
      }
    } else {
      const result = tailorResultFromEnvelope(settled.result);
      persist({ ...session, running: null, result });
      setConfirmed(new Set());
      setKept(new Set());
      if (!result) {
        setFailure({ stage, message: 'The tailored resume could not be read. Try again.' });
      }
    }
    clear();
  }, [fail, persist]);

  const job = useLlmJob({
    storageKey: storageKey ? `talvio-llm-job:v1:tailor:${storageKey}` : null,
    client: llm,
    onSettled,
  });

  // Bumped when the journey is reset, so a request that answers afterwards does not bring it back.
  const runRef = useRef(0);

  const runQuestions = useCallback(async (session: StoredTailor) => {
    const run = runRef.current;
    setFailure(null);
    setPending('questions');
    try {
      let current = session;
      if (!current.sessionId || !current.contextRevisionId) {
        const created = await llm.createSession({
          schemaVersion: LLM_SCHEMA_VERSION,
          clientRequestId: current.clientRequestId,
          purpose: 'tailor',
          source: { source: current.source, document: resumeToCareerDocument(current.document).document },
          jobDescription: { text: current.jobPost.text, title: current.jobPost.title, company: current.jobPost.company, url: null },
        });
        if (run !== runRef.current) {
          void llm.deleteSession(created.sessionId).catch(() => undefined);
          return;
        }
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
      if (run === runRef.current) {
        fail('questions', error);
      }
    }
  }, [fail, job, llm, locale, persist]);

  const runTailoring = useCallback(async () => {
    const session = storedRef.current;
    if (!session?.sessionId || !session.contextRevisionId) {
      return;
    }
    const run = runRef.current;
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
        if (run !== runRef.current) {
          return;
        }
        current = { ...current, contextRevisionId: revision.contextRevisionId, answersSent: signature };
      }
      persist({ ...current, running: 'proposal', result: null });
      setPending(null);
      job.start({
        operation: 'tailor_resume',
        locale,
        sessionId: current.sessionId as string,
        contextRevisionId: current.contextRevisionId as string,
        parentJobId: null,
        input: { resumeName: current.resumeName.slice(0, 300) },
      });
    } catch (error) {
      if (run === runRef.current) {
        fail('proposal', error);
      }
    }
  }, [fail, job, llm, locale, persist]);

  const start = useCallback((input: TailorStart) => {
    setCap(null);
    setFailure(null);
    const created: StoredTailor = {
      ...input,
      v: 1,
      clientRequestId: crypto.randomUUID(),
      sessionId: null,
      contextRevisionId: null,
      questionSetId: null,
      questions: null,
      answers: [],
      currentQuestionId: null,
      unsentAnswer: '',
      answersSent: null,
      result: null,
      running: null,
    };
    persist(created);
    void runQuestions(created);
  }, [persist, runQuestions]);

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

  const result = stored?.result ?? null;
  const document = stored?.document ?? null;
  const review = useMemo(
    () => (result && document ? reviewTailoring(document, result, confirmed, kept) : null),
    [confirmed, document, kept, result],
  );

  /** Ends the journey and deletes the session on the service. */
  const reset = useCallback(() => {
    runRef.current += 1;
    const session = storedRef.current;
    if (job.busy) {
      job.cancel();
    } else {
      job.clear();
    }
    if (session?.sessionId) {
      void llm.deleteSession(session.sessionId).catch(() => undefined);
    }
    persist(null);
    setPending(null);
    setFailure(null);
    setCap(null);
    setConfirmed(new Set());
    setKept(new Set());
  }, [job, llm, persist]);

  /** The new resume's content: the source's look and the tailored document. */
  const preview = useMemo((): PreviewDto | null => {
    if (!review || !stored) {
      return null;
    }
    return { ...stored.look, name: stored.resumeName, resume: review.resume };
  }, [review, stored]);

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
      void runTailoring();
    } else if (session) {
      void runQuestions(session);
    }
  }, [failure?.stage, job, persist, runQuestions, runTailoring]);

  const toggle = (setter: typeof setConfirmed) => (id: string) => {
    setter((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // A journey whose session request was cut off (a reload while it was pending, or before Retry)
  // has neither questions nor a job to wait for: offer Retry, which repeats the request with the
  // same clientRequestId, instead of an endless wait.
  const interrupted = Boolean(stored && !stored.questions && !stored.running && !pending && !failure && !cap);
  const shownFailure: Failure | null = failure
    ?? (interrupted ? { stage: 'questions', message: 'Comparing with the job was interrupted.' } : null);

  let step: TailorStep = 'intake';
  if (stored) {
    if (cap) {
      step = 'capped';
    } else if (shownFailure) {
      step = 'error';
    } else if (pending === 'proposal' || stored.running === 'proposal') {
      step = 'loadingProposal';
    } else if (pending === 'questions' || stored.running === 'questions' || !stored.questions) {
      step = 'loadingQuestions';
    } else if (stored.result) {
      step = 'review';
    } else {
      step = stored.currentQuestionId ? 'questions' : 'answerReview';
    }
  }

  return {
    step,
    jobPost: stored?.jobPost ?? null,
    resumeName: stored?.resumeName ?? '',
    questions: stored?.questions ?? [],
    answers: stored?.answers ?? [],
    currentQuestionId: stored?.currentQuestionId ?? null,
    unsentAnswer: stored?.unsentAnswer ?? '',
    review,
    preview,
    failure: shownFailure,
    cap,
    confirmed,
    kept,
    start,
    setUnsentAnswer,
    answerCurrent,
    goToPreviousQuestion,
    requestTailoring: () => void runTailoring(),
    toggleConfirmed: toggle(setConfirmed),
    toggleKept: toggle(setKept),
    retry,
    reset,
  };
}

export type Tailor = ReturnType<typeof useTailor>;
