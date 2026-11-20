'use client';

import { ChevronLeft, ChevronRight, Info } from 'lucide-react';

import { Button } from '@components/ui';
import { cn } from '@lib/utils';
import {
  ANSWER_LABEL,
  ANSWER_MAX,
  ANSWER_PLACEHOLDER,
  ANSWERS_KEPT_NOTE,
  answerCount,
  BACK_LABEL,
  GET_EDITS_LABEL,
  LAST_QUESTION_NOTE,
  NEXT_LABEL,
  PROGRESS_LABEL,
  questionCounter,
  SKIP_QUESTION_LABEL,
  STOP_LABEL,
  WHY_WE_ASK,
} from '@/lib/profile-improve-copy';

import { ACTION_CLASS, Eyebrow, ScreenCard, ScreenHeading } from './shell';

export type QuestionViewProps = {
  /** 1-based position and the number of questions. */
  n: number;
  total: number;
  target: string;
  prompt: string;
  reason: string;
  guidance: string | null;
  answer: string;
  onAnswerChange: (value: string) => void;
  onBack: () => void;
  onSkip: () => void;
  onNext: () => void;
  onStop: () => void;
};

export function QuestionView({
  n,
  total,
  target,
  prompt,
  reason,
  guidance,
  answer,
  onAnswerChange,
  onBack,
  onSkip,
  onNext,
  onStop,
}: QuestionViewProps) {
  const last = n === total;
  const headingId = `improve-question-${n}`;
  return (
    // Keyed by question so the new heading takes focus.
    <ScreenCard labelledBy={headingId} key={headingId}>
      <div className="flex items-center justify-between gap-3">
        <Eyebrow />
        <span className="text-sm font-medium whitespace-nowrap text-muted-foreground">{questionCounter(n, total)}</span>
      </div>
      <div
        role="progressbar"
        aria-label={PROGRESS_LABEL}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={n}
        className="flex gap-1.5"
      >
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={cn('h-1.5 flex-1 rounded-[0.3rem]', index < n - 1 ? 'bg-secondary' : index === n - 1 ? 'bg-secondary/70' : 'bg-popover')}
          />
        ))}
      </div>
      <p className="m-0 self-start rounded-md bg-popover px-2.5 py-1 text-[1.3rem] font-semibold text-secondary">{target}</p>
      <ScreenHeading id={headingId} className="leading-[1.35] md:text-[2.4rem]">
        {prompt}
      </ScreenHeading>
      {reason && (
        <p className="m-0 flex gap-2.5 rounded-[1rem] bg-background px-[1.4rem] py-3 text-sm leading-[1.5]">
          <Info aria-hidden className="mt-px size-4 flex-none text-secondary" />
          <span>
            <strong className="font-semibold">{WHY_WE_ASK}</strong> {reason}
          </span>
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="improve-answer" className="text-sm font-medium">
          {ANSWER_LABEL}
        </label>
        <textarea
          id="improve-answer"
          rows={5}
          maxLength={ANSWER_MAX}
          value={answer}
          onChange={(event) => onAnswerChange(event.target.value)}
          aria-describedby="improve-answer-guide improve-answer-count"
          placeholder={ANSWER_PLACEHOLDER}
          className="w-full resize-y rounded-md border border-input bg-background p-3 text-[1.5rem] leading-[1.55] text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
        />
        <div className="flex justify-between gap-3 text-[1.3rem] text-muted-foreground">
          <span id="improve-answer-guide">{guidance ?? ''}</span>
          <span id="improve-answer-count" className="whitespace-nowrap">
            {answerCount(answer.length)}
          </span>
        </div>
      </div>
      {last && (
        <p className="m-0 flex gap-2 rounded-[1rem] border border-input px-[1.4rem] py-3 text-sm leading-[1.5]">
          <Info aria-hidden className="mt-0.5 size-4 flex-none text-secondary" />
          <span>{LAST_QUESTION_NOTE}</span>
        </p>
      )}
      {/* Phone order is Next, Skip, Back: the column runs in reverse. */}
      <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-between">
        <Button type="button" variant="ghost" size="lg" className={ACTION_CLASS} onClick={onBack}>
          <ChevronLeft aria-hidden className="size-[1.8rem]" />
          {BACK_LABEL}
        </Button>
        <div className="flex flex-col-reverse gap-3 md:flex-row">
          <Button type="button" variant="outline" size="lg" className={ACTION_CLASS} onClick={onSkip}>
            {SKIP_QUESTION_LABEL}
          </Button>
          <Button type="button" size="lg" className={ACTION_CLASS} onClick={onNext}>
            {last ? GET_EDITS_LABEL : NEXT_LABEL}
            <ChevronRight aria-hidden className="size-[1.8rem]" />
          </Button>
        </div>
      </div>
      <p className="m-0 text-[1.3rem] text-muted-foreground">
        {ANSWERS_KEPT_NOTE}{' '}
        <button
          type="button"
          onClick={onStop}
          className="cursor-pointer border-0 bg-transparent p-0 text-[1.3rem] font-medium text-foreground underline"
        >
          {STOP_LABEL}
        </button>
      </p>
    </ScreenCard>
  );
}
