'use client';

import { Loader2Icon, XIcon } from 'lucide-react';

import { Button } from '@components/ui';
import { AI_CAP_TITLE } from '@lib/ai-cap';
import type { AiProposalResult } from '@lib/ai-improve/payload';
import type { OnboardingQuestion, QuestionAnswer } from '@lib/ai-improve/questions';

import { AnswerReview } from './answer-review';
import { ProposalReview } from './proposal-review';
import { ResumeQuestions } from './resume-questions';

/** The session state the overlay renders; `useAiImprove` in `app/resume/hooks` provides it. */
export type AiImproveOverlaySession = {
  step: 'idle' | 'loadingQuestions' | 'questions' | 'answerReview' | 'loadingProposal' | 'proposalReview' | 'error' | 'capped';
  questions: OnboardingQuestion[];
  answers: QuestionAnswer[];
  currentQuestionId: string | null;
  unsentAnswer: string;
  writingVoiceVersion: number | null;
  review: AiProposalResult | null;
  failure: { stage: 'questions' | 'proposal'; message: string } | null;
  cap: { message: string } | null;
  notice: string | null;
  setUnsentAnswer: (value: string) => void;
  answerCurrent: (status: 'answered' | 'skipped') => void;
  goToPreviousQuestion: () => void;
  requestProposal: () => void;
  accept: () => void;
  reject: () => void;
  cancel: () => void;
  close: () => void;
  retry: () => void;
};

function Pending({ message }: { message: string }) {
  return (
    <div role="status" className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-sm text-muted-foreground">
      <Loader2Icon className="size-6 animate-spin" />
      {message}
    </div>
  );
}

/** Full-height panel over the editor column for one Improve with AI session (MDI-426). */
export function AiImproveOverlay({ session }: { session: AiImproveOverlaySession }) {
  if (session.step === 'idle') {
    return null;
  }

  const currentIndex = Math.max(
    0,
    session.questions.findIndex((question) => question.id === session.currentQuestionId),
  );
  const canGoBack = session.step === 'questions'
    ? currentIndex > 0
    : session.questions.length > 0;
  const dismiss = session.step === 'capped' ? session.close : session.cancel;

  return (
    <div
      role="dialog"
      aria-label="Improve with AI"
      className="absolute inset-0 z-40 flex flex-col overflow-y-auto bg-background px-4 pb-8 pt-16"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">Improve with AI</p>
        <Button type="button" variant="ghost" size="icon" aria-label="Close Improve with AI" onClick={dismiss}>
          <XIcon className="size-4" />
        </Button>
      </div>

      {session.step === 'loadingQuestions' ? <Pending message="Reading your resume..." /> : null}
      {session.step === 'loadingProposal' ? <Pending message="Writing suggestions..." /> : null}

      {session.step === 'questions' && session.questions[currentIndex] ? (
        <ResumeQuestions
          questions={session.questions}
          current={currentIndex}
          input={session.unsentAnswer}
          setInput={session.setUnsentAnswer}
          handleNext={() => session.answerCurrent('answered')}
          handleSkip={() => session.answerCurrent('skipped')}
          onBack={canGoBack ? session.goToPreviousQuestion : undefined}
          onSubmit={() => undefined}
        />
      ) : null}

      {session.step === 'answerReview' ? (
        <AnswerReview
          questions={session.questions}
          answers={session.answers}
          notice={session.notice}
          onBack={canGoBack ? session.goToPreviousQuestion : undefined}
          onImprove={session.requestProposal}
          onCancel={session.cancel}
        />
      ) : null}

      {session.step === 'proposalReview' && session.review ? (
        <ProposalReview
          review={session.review}
          writingVoiceVersion={session.writingVoiceVersion}
          onAccept={session.accept}
          onReject={session.reject}
        />
      ) : null}

      {session.step === 'error' ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">
            {session.failure?.stage === 'proposal' ? 'Could not write suggestions' : 'Could not load questions'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {session.failure?.message ?? 'The AI request failed.'} Your resume was not changed.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={session.cancel}>
              Cancel
            </Button>
            <Button type="button" onClick={session.retry}>
              Retry
            </Button>
          </div>
        </section>
      ) : null}

      {session.step === 'capped' ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">{AI_CAP_TITLE}</h2>
          <p className="text-sm text-muted-foreground">{session.cap?.message}</p>
          <p className="text-sm text-muted-foreground">Your resume was not changed. Your answers are kept for later.</p>
          <div className="flex justify-end">
            <Button type="button" onClick={session.close}>
              Close
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
