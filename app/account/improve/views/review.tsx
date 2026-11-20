'use client';

import { AlignLeft, CircleAlert } from 'lucide-react';

import { Button } from '@components/ui';
import { cn } from '@lib/utils';
import {
  CLAIM_MISSING,
  CONFIRM_TRUE,
  KEEP_PROFILE_LABEL,
  NOW_PREFIX,
  REVIEW_INTRO,
  reviewTitle,
  saveEditsLabel,
  SKIPPED_EDITS_NOTE,
  SUGGESTED_PREFIX,
} from '@/lib/profile-improve-copy';

import { ACTION_CLASS, Eyebrow, ScreenHeading } from './shell';

export type ReviewCard = {
  id: string;
  where: string;
  before: string;
  after: string;
  from: string;
  selected: boolean;
  /** The facts to confirm, when the change adds one; empty otherwise. */
  claim: string;
  confirmed: boolean;
};

export type ReviewViewProps = {
  cards: ReviewCard[];
  skipped: number;
  /** True after a Save that was blocked by an unconfirmed claim. */
  claimMissing: boolean;
  saving: boolean;
  onToggle: (id: string) => void;
  onToggleClaim: (id: string) => void;
  onSave: () => void;
  onKeep: () => void;
};

const SR_ONLY = 'absolute size-px overflow-hidden [clip:rect(0_0_0_0)]';

export function ReviewView({ cards, skipped, claimMissing, saving, onToggle, onToggleClaim, onSave, onKeep }: ReviewViewProps) {
  const selected = cards.filter((card) => card.selected).length;
  return (
    <section aria-labelledby="improve-review" className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Eyebrow />
        <ScreenHeading id="improve-review">{reviewTitle(cards.length)}</ScreenHeading>
        <p className="m-0 text-[1.5rem] text-muted-foreground">{REVIEW_INTRO}</p>
        {skipped > 0 && <p className="m-0 text-sm text-muted-foreground">{SKIPPED_EDITS_NOTE(skipped)}</p>}
      </div>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {cards.map((card) => {
          const flagged = claimMissing && card.selected && card.claim !== '' && !card.confirmed;
          return (
            <li
              key={card.id}
              data-testid="improve-change"
              className={cn(
                'flex gap-[1.4rem] rounded-[1.4rem] bg-card p-4 md:p-5',
                card.selected && 'ring-1 ring-secondary',
              )}
            >
              <input
                type="checkbox"
                id={`change-${card.id}`}
                checked={card.selected}
                onChange={() => onToggle(card.id)}
                aria-describedby={`change-${card.id}-from`}
                className="mt-0.5 size-5 flex-none accent-secondary"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                <label htmlFor={`change-${card.id}`} className="text-[1.3rem] font-semibold text-secondary">
                  {card.where}
                </label>
                {card.before && (
                  <p className="m-0 text-sm leading-[1.55] break-words whitespace-pre-line text-muted-foreground line-through">
                    <span className={SR_ONLY}>{NOW_PREFIX}</span>
                    {card.before}
                  </p>
                )}
                <p className="m-0 text-[1.5rem] leading-[1.55] break-words whitespace-pre-line text-foreground">
                  <span className={SR_ONLY}>{SUGGESTED_PREFIX}</span>
                  {card.after}
                </p>
                <p id={`change-${card.id}-from`} className="m-0 flex items-center gap-1.5 text-[1.3rem] text-muted-foreground">
                  <AlignLeft aria-hidden className="size-[1.4rem]" />
                  {card.from}
                </p>
                {card.claim && (
                  <label
                    className={cn(
                      'flex items-start gap-2.5 rounded-[1rem] border bg-background px-3 py-2.5 text-sm leading-[1.5]',
                      flagged ? 'border-destructive' : 'border-input',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={card.confirmed}
                      onChange={() => onToggleClaim(card.id)}
                      aria-invalid={flagged || undefined}
                      className="mt-px size-[1.8rem] flex-none accent-secondary"
                    />
                    <span>
                      <strong className="font-semibold">{CONFIRM_TRUE}</strong> {card.claim}
                    </span>
                  </label>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {claimMissing && (
        <p role="alert" className="m-0 flex items-center gap-2 text-sm text-foreground">
          <CircleAlert aria-hidden className="size-4 text-destructive" />
          {CLAIM_MISSING}
        </p>
      )}
      <div className="sticky bottom-0 flex flex-col gap-3 border-t border-input bg-background py-4 md:flex-row">
        <Button type="button" size="lg" className={ACTION_CLASS} onClick={onSave} disabled={saving || selected === 0} loading={saving}>
          {saveEditsLabel(selected)}
        </Button>
        <Button type="button" variant="outline" size="lg" className={ACTION_CLASS} onClick={onKeep} disabled={saving}>
          {KEEP_PROFILE_LABEL}
        </Button>
      </div>
    </section>
  );
}
