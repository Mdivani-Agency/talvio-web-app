'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { submitWrapper } from '@app/actions/action.utils';
import { useLlmJob } from '@hooks/use-llm-job';
import { nextQuestionId, previousQuestionId, upsertAnswer, type OnboardingQuestion, type QuestionAnswer } from '@lib/ai-improve/questions';
import { AI_IMPROVE_SESSION_PREFIX, aiImproveJobStorageKey, profileImproveStorageKey } from '@lib/drafts';
import { profileToCareerDocument } from '@lib/llm/career-document';
import { createLlmClient, type LlmClient } from '@lib/llm/client';
import { LLM_SCHEMA_VERSION, type JobRequestBody, type SessionAnswer, type SourceRef } from '@lib/llm/contract';
import { LlmError, profileImproveErrorState, type ProfileImproveErrorState } from '@lib/llm/errors';
import { proposalFromEnvelope, type ServiceProposal } from '@lib/llm/improve-proposal';
import type { LlmJobState } from '@lib/llm/job-runner';
import { profileApplyRequest, reviewProfileProposal } from '@lib/llm/profile-proposal';
import type { Account } from '@lib/types';

import { useApplyProfileProposal } from '../query/use-apply-profile-proposal';
import { profileImprovementKey, useProfileImprovement } from '../query/use-profile-improvement';

/*
 * "Make your profile stronger" after Save profile (MDI-645, epic MDI-643). Client logic only; the
 * screens come in MDI-646. One run on the LLM service:
 * 1. POST /sessions (purpose improve) with the saved profile as a CareerDocument, source
 *    `{ kind: 'profile', id: userId, revision: updatedAt }`.
 * 2. An analyze_resume job over every section.
 * 3. generate_questions (round 1, up to 5) from that analysis. Zero questions is a valid result.
 * 4. POST /sessions/{id}/answers once, with answered and skipped items.
 * 5. improve_profile on the new revision. This uses up the free improvement (the /api/llm adapter
 *    and the service both enforce once per account); it keeps one Idempotency-Key for every repeat.
 * 6. The proposal is reviewed change by change and the selected changes saved through
 *    apply_llm_proposal. DELETE /sessions/{id} on done, skip or stop.
 *
 * The run survives a reload at the same step, with the typed answer. Stopping before step 5 leaves
 * the improvement unused.
 */

export type ProfileImproveStep =
  | 'idle'
  | 'loading'
  | 'questions'
  | 'nothingToAsk'
  | 'loadingProposal'
  | 'review'
  | 'done'
  | 'used'
  | 'limit'
  | 'unavailable'
  | 'signIn'
  | 'expired'
  | 'error';

type Running = 'analysis' | 'questions' | 'proposal';

/** What a wait is doing, for the loading screen's live status. */
export type ProfileImproveLoadingStage = 'analysis' | 'questions' | 'answers' | 'proposal';

/** The parts of a service question the screen shows besides the prompt. */
export type ProfileQuestionDetail = {
  reason: string;
  guidance: string | null;
  targetSection: string | null;
  targetEntityId: string | null;
};

type StoredSession = {
  v: 1;
  /** createSession's key, so a repeat after a lost answer returns the same session. */
  clientRequestId: string;
  source: Extract<SourceRef, { kind: 'profile' }>;
  sessionId: string | null;
  contextRevisionId: string | null;
  analysisJobId: string | null;
  questionSetId: string | null;
  questions: OnboardingQuestion[] | null;
  /** Reason, guidance and target of each question, by id. */
  questionDetails?: Record<string, ProfileQuestionDetail>;
  answers: QuestionAnswer[];
  currentQuestionId: string | null;
  unsentAnswer: string;
  /** The answers already sent, so a retry does not send them again. */
  answersSent: string | null;
  proposal: ServiceProposal | null;
  proposalJobId: string | null;
  running: Running | null;
};

type Failure = { stage: Running; state: ProfileImproveErrorState; message: string };

type Options = {
  userId: string | undefined;
  /** The saved profile; null while it loads. */
  account: Account | null;
  locale?: string;
  client?: LlmClient;
};

function storageKeyFor(userId: string | undefined) {
  return userId ? profileImproveStorageKey(userId) : null;
}

function readStored(key: string | null): StoredSession | null {
  if (!key || typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(`${AI_IMPROVE_SESSION_PREFIX}${key}`);
    const parsed = raw ? (JSON.parse(raw) as StoredSession) : null;
    return parsed?.v === 1 && parsed.source?.kind === 'profile' ? parsed : null;
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
      window.localStorage.setItem(`${AI_IMPROVE_SESSION_PREFIX}${key}`, JSON.stringify(value));
    } else {
      window.localStorage.removeItem(`${AI_IMPROVE_SESSION_PREFIX}${key}`);
    }
  } catch {
    // Quota or private mode: the run lives in memory only.
  }
}

function sessionAnswers(answers: QuestionAnswer[]): SessionAnswer[] {
  return answers.map((answer): SessionAnswer => {
    const value = answer.status === 'answered' ? answer.value.trim().slice(0, 2_000) : '';
    return value
      ? { questionId: answer.questionId, status: 'answered', value }
      : { questionId: answer.questionId, status: 'skipped' };
  });
}

function questionsFrom(result: unknown): {
  questionSetId: string;
  questions: OnboardingQuestion[];
  details: Record<string, ProfileQuestionDetail>;
} | null {
  const set = result as { questionSetId?: unknown; questions?: unknown } | null;
  if (!set || typeof set.questionSetId !== 'string' || !Array.isArray(set.questions)) {
    return null;
  }
  const details: Record<string, ProfileQuestionDetail> = {};
  const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value : null);
  const questions = set.questions.flatMap((item): OnboardingQuestion[] => {
    const question = item as {
      id?: unknown;
      prompt?: unknown;
      guidance?: unknown;
      reason?: unknown;
      targetSection?: unknown;
      targetEntityId?: unknown;
    };
    if (typeof question.id !== 'string' || typeof question.prompt !== 'string') {
      return [];
    }
    const guidance = text(question.guidance);
    const reason = text(question.reason) ?? '';
    details[question.id] = {
      reason,
      guidance,
      targetSection: text(question.targetSection),
      targetEntityId: text(question.targetEntityId),
    };
    return [{ id: question.id, question: question.prompt, example: guidance ?? reason }];
  });
  return { questionSetId: set.questionSetId, questions, details };
}

export function useProfileImprove({ userId, account, locale = 'en-US', client }: Options) {
  const llm = useMemo(() => client ?? createLlmClient(), [client]);
  const queryClient = useQueryClient();
  const improvement = useProfileImprovement(userId);
  const applyMutation = useApplyProfileProposal(userId);
  const storageKey = storageKeyFor(userId);

  const [stored, setStored] = useState<StoredSession | null>(() => readStored(storageKey));
  const [seenKey, setSeenKey] = useState(storageKey);
  const [pending, setPending] = useState<Running | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [refused, setRefused] = useState<'used' | null>(null);
  const [done, setDone] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set(stored?.proposal?.changes.map((change) => change.id) ?? []));
  const [confirmed, setConfirmed] = useState<ReadonlySet<string>>(() => new Set());
  const [saving, setSaving] = useState(false);
  const storedRef = useRef(stored);
  const accountRef = useRef(account);
  const runRef = useRef(0);

  // The user id arrives after the first render while the session loads.
  if (seenKey !== storageKey) {
    setSeenKey(storageKey);
    const next = readStored(storageKey);
    setStored(next);
    setSelected(new Set(next?.proposal?.changes.map((change) => change.id) ?? []));
  }

  useEffect(() => {
    storedRef.current = stored;
    accountRef.current = account;
  });

  const persist = useCallback((next: StoredSession | null) => {
    storedRef.current = next;
    setStored(next);
    writeStored(storageKey, next);
  }, [storageKey]);

  const fail = useCallback((stage: Running, error: unknown) => {
    setPending(null);
    const state = profileImproveErrorState(error);
    if (state === 'expired') {
      // The service no longer has this session or its context: a new run starts over.
      persist(null);
    }
    setFailure({ stage, state, message: error instanceof Error ? error.message : 'Something went wrong' });
  }, [persist]);

  const startRef = useRef<(request: JobRequestBody) => void>(() => undefined);

  const jobRequest = useCallback((session: StoredSession, operation: Running): JobRequestBody => {
    const binding = {
      locale,
      sessionId: session.sessionId as string,
      contextRevisionId: session.contextRevisionId as string,
      parentJobId: null,
    };
    if (operation === 'analysis') {
      return { ...binding, operation: 'analyze_resume', input: { sections: [] } };
    }
    if (operation === 'questions') {
      return {
        ...binding,
        operation: 'generate_questions',
        input: { analysisJobId: session.analysisJobId, round: 1, maxQuestions: 5 },
      };
    }
    const role = accountRef.current?.profile.role?.trim();
    return { ...binding, operation: 'improve_profile', input: { sections: [], targetRole: role ? role.slice(0, 200) : null } };
  }, [locale]);

  // A finished job moves the run on; a failed one shows why. Called by the job runner.
  const onSettled = useCallback((settled: Extract<LlmJobState, { phase: 'succeeded' | 'failed' }>, clear: () => void, { resumable }: { resumable: boolean }) => {
    const session = storedRef.current;
    if (!session) {
      return;
    }
    const stage = session.running ?? 'analysis';
    if (settled.phase === 'failed') {
      if (!resumable) {
        // A refused submission left no job to wait for: keep the answers, drop the wait.
        persist({ ...session, running: null });
      }
      fail(stage, settled.error);
      return;
    }
    clear();
    if (stage === 'analysis') {
      const next: StoredSession = { ...session, analysisJobId: settled.jobId, running: 'questions' };
      persist(next);
      // After the runner's own clear, which is queued first.
      queueMicrotask(() => startRef.current(jobRequest(next, 'questions')));
      return;
    }
    if (stage === 'questions') {
      const set = questionsFrom(settled.result.result);
      if (!set) {
        persist({ ...session, running: null });
        setFailure({ stage, state: 'retry', message: 'The questions could not be read. Try again.' });
        return;
      }
      persist({
        ...session,
        running: null,
        questionSetId: set.questionSetId,
        questions: set.questions,
        questionDetails: set.details,
        answers: [],
        currentQuestionId: set.questions[0]?.id ?? null,
        unsentAnswer: '',
      });
      return;
    }
    const proposal = proposalFromEnvelope(settled.result);
    persist({
      ...session,
      running: null,
      proposal: proposal ?? session.proposal,
      proposalJobId: proposal ? settled.result.jobId ?? settled.jobId : session.proposalJobId,
    });
    if (proposal) {
      setSelected(new Set(proposal.changes.map((change) => change.id)));
      setConfirmed(new Set());
    } else {
      setFailure({ stage, state: 'retry', message: 'The suggestions could not be read. Try again.' });
    }
  }, [fail, jobRequest, persist]);

  const job = useLlmJob({
    storageKey: storageKey ? aiImproveJobStorageKey(storageKey) : null,
    client: llm,
    onSettled,
  });

  useEffect(() => {
    startRef.current = job.start;
  }, [job.start]);

  // Once improve_profile is admitted the improvement is used: refresh the flag for the account page.
  const admittedJobId = stored?.running === 'proposal' && job.state.phase === 'running' ? job.state.jobId : null;
  useEffect(() => {
    if (admittedJobId) {
      void queryClient.invalidateQueries({ queryKey: profileImprovementKey(userId) });
    }
  }, [admittedJobId, queryClient, userId]);

  const runAnalysis = useCallback(async (session: StoredSession) => {
    const run = runRef.current;
    setFailure(null);
    setPending('analysis');
    try {
      let current = session;
      if (!current.sessionId || !current.contextRevisionId) {
        const saved = accountRef.current;
        if (!saved) {
          throw new Error('Your profile is still loading. Try again in a moment.');
        }
        const { document } = profileToCareerDocument(saved);
        const created = await llm.createSession({
          schemaVersion: LLM_SCHEMA_VERSION,
          clientRequestId: current.clientRequestId,
          purpose: 'improve',
          source: { source: current.source, document },
          jobDescription: null,
        });
        if (run !== runRef.current) {
          void llm.deleteSession(created.sessionId).catch(() => undefined);
          return;
        }
        current = { ...current, sessionId: created.sessionId, contextRevisionId: created.latestContext.contextRevisionId };
      }
      const stage: Running = current.analysisJobId ? 'questions' : 'analysis';
      const next = { ...current, running: stage };
      persist(next);
      setPending(null);
      job.start(jobRequest(next, stage));
    } catch (error) {
      if (run === runRef.current) {
        fail('analysis', error);
      }
    }
  }, [fail, job, jobRequest, llm, persist]);

  const runProposal = useCallback(async () => {
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
        const sessionId = current.sessionId as string;
        const revision = await llm
          .submitAnswers(sessionId, {
            baseContextRevisionId: current.contextRevisionId as string,
            questionSetId: current.questionSetId,
            answers,
          })
          .catch(async (error: unknown) => {
            // The answers may have arrived before a lost reply or a reload. This run sends answers
            // only once, so a newer revision made by answers is that submission: carry on from it.
            if (!(error instanceof LlmError) || error.code !== 'stale_context') {
              throw error;
            }
            const { latestContext } = await llm.getSession(sessionId);
            if (latestContext.contextRevisionId === current.contextRevisionId || !latestContext.answerRevisionId) {
              throw error;
            }
            return latestContext;
          });
        if (run !== runRef.current) {
          return;
        }
        current = { ...current, contextRevisionId: revision.contextRevisionId, answersSent: signature };
      }
      const next: StoredSession = { ...current, running: 'proposal', proposal: null };
      persist(next);
      setPending(null);
      job.start(jobRequest(next, 'proposal'));
    } catch (error) {
      if (run === runRef.current) {
        fail('proposal', error);
      }
    }
  }, [fail, job, jobRequest, llm, persist]);

  /**
   * Every question is answered but no suggestions job is stored: the page was reloaded while the
   * answers were being sent. Send them (or skip that, when they arrived) and request the job again.
   */
  const answeredWithoutProposal = Boolean(
    stored?.questions?.length && !stored.currentQuestionId && !stored.running && !stored.proposal,
  );
  useEffect(() => {
    if (answeredWithoutProposal && !pending && !failure && !done) {
      void runProposal();
    }
  }, [answeredWithoutProposal, done, failure, pending, runProposal]);

  /**
   * On load, a stored run with no questions, no job and no proposal was reloaded while the session
   * was being created or the analysis requested. Start it again: the stored clientRequestId returns
   * the same session if it was created. Checked once per account, so a later state is left alone.
   */
  const loadChecked = useRef<string | null>(null);
  useEffect(() => {
    if (!storageKey || loadChecked.current === storageKey) {
      return;
    }
    const notStarted = stored && !stored.questions && !stored.running && !stored.proposal;
    if (notStarted && !stored.sessionId && !account) {
      // A new session needs the saved profile: check again once it loads.
      return;
    }
    loadChecked.current = storageKey;
    if (notStarted) {
      const session = stored;
      queueMicrotask(() => void runAnalysis(session));
    }
  }, [account, runAnalysis, storageKey, stored]);

  /** Starts a run, or picks up the stored one. Does nothing once the improvement is used. */
  const start = useCallback(() => {
    setDone(false);
    setRefused(null);
    const session = storedRef.current;
    if (session) {
      if (!session.questions && !session.running && !session.proposal && !pending) {
        void runAnalysis(session);
      } else if (session.questions?.length && !session.currentQuestionId && !session.running && !session.proposal && !pending) {
        void runProposal();
      }
      return;
    }
    if (improvement.data?.used) {
      setRefused('used');
      return;
    }
    if (!userId || !account) {
      return;
    }
    const created: StoredSession = {
      v: 1,
      clientRequestId: crypto.randomUUID(),
      source: { kind: 'profile', id: userId, revision: (account.updatedAt ?? '').slice(0, 64) || 'unsaved' },
      sessionId: null,
      contextRevisionId: null,
      analysisJobId: null,
      questionSetId: null,
      questions: null,
      answers: [],
      currentQuestionId: null,
      unsentAnswer: '',
      answersSent: null,
      proposal: null,
      proposalJobId: null,
      running: null,
    };
    persist(created);
    void runAnalysis(created);
  }, [account, improvement.data?.used, pending, persist, runAnalysis, runProposal, userId]);

  const setUnsentAnswer = useCallback((unsentAnswer: string) => {
    const session = storedRef.current;
    if (session) {
      persist({ ...session, unsentAnswer });
    }
  }, [persist]);

  /** Answers or skips the current question; after the last one the suggestions are requested. */
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
    if (!nextId) {
      void runProposal();
    }
  }, [persist, runProposal]);

  /** Back to the previous question, keeping what was typed there. */
  const goToPreviousQuestion = useCallback(() => {
    const session = storedRef.current;
    if (!session?.questions) {
      return;
    }
    const current = session.currentQuestionId;
    const previousId = current ? previousQuestionId(session.questions, current) : session.questions.at(-1)?.id ?? null;
    if (previousId) {
      // Keep what was typed here, so going forward again finds it.
      const answers = current && session.unsentAnswer.trim()
        ? upsertAnswer(session.answers, { questionId: current, status: 'answered', value: session.unsentAnswer })
        : session.answers;
      persist({
        ...session,
        answers,
        currentQuestionId: previousId,
        unsentAnswer: answers.find((answer) => answer.questionId === previousId)?.value ?? '',
      });
    }
  }, [persist]);

  /** Skips every question left and requests the suggestions. */
  const skipRemaining = useCallback(() => {
    const session = storedRef.current;
    if (!session?.questions) {
      return;
    }
    let answers = session.answers;
    let from = session.currentQuestionId;
    while (from) {
      const id: string = from;
      if (!answers.some((answer) => answer.questionId === id)) {
        answers = upsertAnswer(answers, { questionId: id, status: 'skipped', value: '' });
      }
      from = nextQuestionId(session.questions, id);
    }
    persist({ ...session, answers, currentQuestionId: null, unsentAnswer: '' });
    void runProposal();
  }, [persist, runProposal]);

  const proposal = stored?.proposal ?? null;
  const review = useMemo(
    () => (proposal && account ? reviewProfileProposal(account, proposal, selected, confirmed) : null),
    [account, confirmed, proposal, selected],
  );

  /** Ends the run: cancels a running job and deletes the session on the service. */
  const end = useCallback(() => {
    runRef.current += 1;
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
    setSelected(new Set());
    setConfirmed(new Set());
  }, [job, llm, persist]);

  const canSave = Boolean(review && review.applied.length > 0 && review.unconfirmed.length === 0 && !saving);

  /** Saves the selected changes with their confirmed claims, then ends the run. */
  const save = useCallback(async () => {
    const session = storedRef.current;
    if (!review || !session?.proposal || !canSave) {
      return false;
    }
    const run = runRef.current;
    setSaving(true);
    try {
      const saved = await submitWrapper({
        fn: () =>
          applyMutation.mutateAsync(
            profileApplyRequest({
              review,
              proposal: session.proposal as ServiceProposal,
              confirmed,
              jobId: session.proposalJobId,
              sessionId: session.sessionId,
              source: session.source,
            }),
          ),
        successMessage: 'Your profile is updated.',
      });
      if (saved && run === runRef.current) {
        setSavedCount(review.applied.length);
        end();
        setDone(true);
      }
      return saved;
    } finally {
      setSaving(false);
    }
  }, [applyMutation, canSave, confirmed, end, review]);

  const retry = useCallback(() => {
    const stage = failure?.stage;
    const session = storedRef.current;
    setFailure(null);
    if (job.state.phase === 'failed' && job.state.error.retryable && session) {
      persist({ ...session, running: stage ?? 'analysis' });
      job.retry();
      return;
    }
    if (stage === 'proposal') {
      // The same request rejoins its stored submission, so the Idempotency-Key is kept.
      void runProposal();
      return;
    }
    job.clear();
    if (session) {
      void runAnalysis(session);
    } else {
      start();
    }
  }, [failure?.stage, job, persist, runAnalysis, runProposal, start]);

  const toggle = (set: ReadonlySet<string>, id: string) => {
    const next = new Set(set);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return next;
  };
  const toggleSelected = useCallback((changeId: string) => setSelected((current) => toggle(current, changeId)), []);
  const toggleConfirmed = useCallback((changeId: string) => setConfirmed((current) => toggle(current, changeId)), []);

  let step: ProfileImproveStep = 'idle';
  if (done) {
    step = 'done';
  } else if (refused === 'used') {
    step = 'used';
  } else if (failure) {
    step = failure.state === 'retry' ? 'error' : failure.state;
  } else if (stored) {
    if (pending === 'proposal' || stored.running === 'proposal') {
      step = 'loadingProposal';
    } else if (stored.proposal) {
      step = 'review';
    } else if (pending || stored.running || !stored.questions) {
      step = 'loading';
    } else if (stored.questions.length === 0) {
      step = 'nothingToAsk';
    } else {
      step = stored.currentQuestionId ? 'questions' : 'loadingProposal';
    }
  }

  let loadingStage: ProfileImproveLoadingStage | null = null;
  if (step === 'loading') {
    loadingStage = stored?.running === 'questions' ? 'questions' : 'analysis';
  } else if (step === 'loadingProposal') {
    loadingStage = stored?.running === 'proposal' ? 'proposal' : 'answers';
  }

  return {
    step,
    loadingStage,
    savedCount,
    questionDetails: stored?.questionDetails ?? {},
    /** The free improvement from the database flag; `used` is true once improve_profile was admitted. */
    improvement: improvement.data ?? null,
    /** The flag could not be read: the page offers a retry instead of waiting. */
    improvementError: improvement.isError && !improvement.data,
    refetchImprovement: () => void improvement.refetch(),
    questions: stored?.questions ?? [],
    answers: stored?.answers ?? [],
    currentQuestionId: stored?.currentQuestionId ?? null,
    unsentAnswer: stored?.unsentAnswer ?? '',
    review,
    failure,
    saving,
    canSave,

    start,
    setUnsentAnswer,
    answerCurrent,
    goToPreviousQuestion,
    skipRemaining,
    requestProposal: () => void runProposal(),
    toggleSelected,
    toggleConfirmed,
    save,
    retry,
    /** Skip or stop: ends the run. Before improve_profile is requested the improvement stays unused. */
    stop: end,
    /** Leaves the done or refusal screen. */
    dismiss: () => {
      setDone(false);
      setRefused(null);
      setFailure(null);
    },
  };
}
