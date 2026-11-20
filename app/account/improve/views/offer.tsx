'use client';

import { Check, Clock, Info, SkipForward, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@components/ui';
import {
  ACCOUNT_HREF,
  AI_NOTICE,
  FREE_ONCE_TAG,
  OFFER_BODY,
  OFFER_POINTS,
  OFFER_TITLE,
  PROFILE_SAVED_BANNER,
  SKIP_FOR_NOW_LABEL,
  START_QUESTIONS_LABEL,
} from '@/lib/profile-improve-copy';

import { ACTION_CLASS, ACTIONS_CLASS, Eyebrow, ScreenCard, ScreenHeading } from './shell';

const POINT_ICONS = [Clock, SkipForward, Check];

export function OfferView({ saved, onStart, starting }: { saved: boolean; onStart: () => void; starting: boolean }) {
  return (
    <>
      {saved && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-[1.2rem] bg-green-50 px-4 py-[1.4rem] text-[1.5rem] font-medium text-green-950 dark:bg-green-950 dark:text-green-100"
        >
          <span className="flex size-7 flex-none items-center justify-center rounded-full bg-green-600 text-white">
            <Check aria-hidden className="size-4" strokeWidth={3} />
          </span>
          {PROFILE_SAVED_BANNER}
        </div>
      )}
      <ScreenCard labelledBy="improve-offer">
        <Eyebrow />
        <p className="m-0 self-start rounded-md bg-green-50 px-2.5 py-1 text-[1.3rem] font-semibold text-green-950 dark:bg-green-950 dark:text-green-100">
          {FREE_ONCE_TAG}
        </p>
        <ScreenHeading id="improve-offer">{OFFER_TITLE}</ScreenHeading>
        <p className="m-0 text-md leading-[1.6] text-muted-foreground">{OFFER_BODY}</p>
        <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 md:grid-cols-3">
          {OFFER_POINTS.map((point, index) => {
            const PointIcon = POINT_ICONS[index] ?? Check;
            return (
              <li key={point.title} className="flex flex-col gap-1.5 rounded-[1.2rem] bg-background p-4">
                <PointIcon aria-hidden className="size-5 text-secondary" />
                <span className="text-[1.5rem] font-semibold">{point.title}</span>
                <span className="text-sm text-muted-foreground">{point.body}</span>
              </li>
            );
          })}
        </ul>
        <div className={ACTIONS_CLASS}>
          <Button type="button" size="lg" className={ACTION_CLASS} onClick={onStart} disabled={starting}>
            <Sparkles aria-hidden className="size-[1.8rem]" />
            {START_QUESTIONS_LABEL}
          </Button>
          <Button asChild variant="ghost" size="lg" className={ACTION_CLASS}>
            <Link href={ACCOUNT_HREF}>{SKIP_FOR_NOW_LABEL}</Link>
          </Button>
        </div>
        <p className="m-0 flex gap-2 text-[1.3rem] leading-[1.5] text-muted-foreground">
          <Info aria-hidden className="mt-px size-4 flex-none" />
          <span>{AI_NOTICE}</span>
        </p>
      </ScreenCard>
    </>
  );
}
