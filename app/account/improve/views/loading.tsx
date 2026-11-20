'use client';

import { Check } from 'lucide-react';

import { Button } from '@components/ui';
import type { ProfileImproveLoadingStage } from '@app/account/hooks/use-profile-improve';
import { cn } from '@lib/utils';
import {
  CANCEL_LABEL,
  LOADING_NOTE,
  LOADING_PROPOSAL_STEPS,
  LOADING_PROPOSAL_TITLE,
  LOADING_QUESTIONS_STEPS,
  LOADING_QUESTIONS_TITLE,
} from '@/lib/profile-improve-copy';

import { ACTION_CLASS, Eyebrow, ScreenCard, ScreenHeading } from './shell';

/** Two steps with live status: reading and picking questions, or sending answers and writing edits. */
export function LoadingView({ stage, onCancel }: { stage: ProfileImproveLoadingStage; onCancel: () => void }) {
  const proposal = stage === 'answers' || stage === 'proposal';
  const steps = proposal ? LOADING_PROPOSAL_STEPS : LOADING_QUESTIONS_STEPS;
  const current = stage === 'questions' || stage === 'proposal' ? 1 : 0;
  return (
    <ScreenCard labelledBy="improve-loading" busy>
      <Eyebrow />
      <ScreenHeading id="improve-loading">{proposal ? LOADING_PROPOSAL_TITLE : LOADING_QUESTIONS_TITLE}</ScreenHeading>
      <ol role="status" aria-live="polite" className="m-0 flex list-none flex-col gap-[1.4rem] p-0">
        {steps.map((label, index) => (
          <li
            key={label}
            data-state={index < current ? 'done' : index === current ? 'active' : 'todo'}
            className={cn('flex items-center gap-3 text-[1.5rem]', index > current && 'text-muted-foreground')}
          >
            {index < current ? (
              <span className="flex size-5 flex-none items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <Check aria-hidden className="size-3" strokeWidth={3} />
              </span>
            ) : index === current ? (
              <span aria-hidden className="size-5 flex-none animate-spin rounded-full border-[2.5px] border-popover border-t-secondary" />
            ) : (
              <span aria-hidden className="size-5 flex-none rounded-full border-[1.5px] border-input" />
            )}
            {label}
          </li>
        ))}
      </ol>
      <p className="m-0 text-sm text-muted-foreground">{LOADING_NOTE}</p>
      <div>
        <Button type="button" variant="outline" size="lg" className={ACTION_CLASS} onClick={onCancel}>
          {CANCEL_LABEL}
        </Button>
      </div>
    </ScreenCard>
  );
}
