'use client';

import { FileText } from 'lucide-react';
import type { HTMLAttributes, Ref } from 'react';

import { Card } from '@components/ui';
import { FOLLOW_UP_LABEL, OUTCOME_NAMES, RESUME_LINKED_LABEL } from '@/lib/applications-copy';
import { isClosedStage } from '@lib/schema/application.schema';
import type { ApplicationStage, JobApplication } from '@lib/types';
import { cn } from '@lib/utils';

import { dateLine, needsFollowUp } from '../board';
import { MoveMenu } from './move-menu';
import { ACCEPTED_TONE, CHIP_CLASS, FOLLOW_UP_TONE, LABEL_TONES, OUTCOME_TONE } from './tones';

type ApplicationCardProps = {
  application: JobApplication;
  now: Date;
  onMove: (stage: ApplicationStage) => void;
  /** The phone list puts cards on the page background, so they use the card colour; the board's columns already do. */
  surface?: 'board' | 'list';
  dragging?: boolean;
  cardRef?: Ref<HTMLDivElement>;
} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

export function ApplicationCard({
  application,
  now,
  onMove,
  surface = 'board',
  dragging = false,
  cardRef,
  className,
  ...rest
}: ApplicationCardProps) {
  const followUp = needsFollowUp(application, now);
  const outcome = isClosedStage(application.stage) ? application.stage : null;

  return (
    <Card
      ref={cardRef}
      data-testid="application-card"
      className={cn(
        'relative gap-2 rounded-[1.2rem] p-3 shadow-[0_1px_2px_rgba(13,13,13,0.08)]',
        surface === 'board' ? 'bg-background' : 'bg-card p-3.5',
        dragging && 'opacity-40',
        className,
      )}
      {...rest}
    >
      <div className="flex items-start gap-1">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 className="text-sm leading-[1.4] font-semibold break-words text-primary">{application.position}</h3>
          <p className="text-[1.3rem] break-words text-muted-foreground">{application.company}</p>
        </div>
        <MoveMenu application={application} onMove={onMove} />
      </div>
      {outcome ? (
        <span className={cn(CHIP_CLASS, 'self-start', outcome === 'accepted' ? ACCEPTED_TONE : OUTCOME_TONE)}>
          {OUTCOME_NAMES[outcome]}
        </span>
      ) : null}
      {application.labels.length > 0 ? (
        <ul className="flex flex-wrap gap-1" aria-label="Labels">
          {application.labels.map((label) => (
            <li key={label.name} className={cn(CHIP_CLASS, LABEL_TONES[label.color])}>
              {label.name}
            </li>
          ))}
        </ul>
      ) : null}
      <p className={cn('flex items-center gap-1.5 text-xs leading-[1.5] text-muted-foreground', followUp && FOLLOW_UP_TONE)}>
        <span>
          {dateLine(application, now)}
          {followUp ? ` · ${FOLLOW_UP_LABEL}` : null}
        </span>
        {application.resumeId ? (
          <span title={RESUME_LINKED_LABEL} className="ml-auto flex text-muted-foreground">
            <FileText aria-hidden="true" className="size-[1.6rem]" />
            <span className="sr-only">{RESUME_LINKED_LABEL}</span>
          </span>
        ) : null}
      </p>
    </Card>
  );
}
