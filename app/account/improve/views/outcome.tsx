'use client';

import { Check, Info, Plus, Sparkles } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Button } from '@components/ui';
import {
  ACCOUNT_HREF,
  CREATE_RESUME_LABEL,
  DONE_BODY,
  doneTitle,
  EXPIRED_BODY,
  EXPIRED_TITLE,
  GET_EDITS_LABEL,
  GO_TO_ACCOUNT_LABEL,
  IMPROVE_HREF,
  LAST_QUESTION_NOTE,
  LATER_NOTE,
  LIMIT_TITLE,
  limitBody,
  limitResetTime,
  NO_EDITS_BODY,
  NO_EDITS_TITLE,
  NOTHING_TO_ASK_BODY,
  NOTHING_TO_ASK_TITLE,
  RESUME_HREF,
  SIGN_IN_LABEL,
  SIGN_IN_TITLE,
  START_AGAIN_LABEL,
  STOP_LABEL,
  TRY_AGAIN_LABEL,
  USED_TITLE,
  usedBody,
  usedOnDate,
} from '@/lib/profile-improve-copy';

import { ACTION_CLASS, ACTIONS_CLASS, Eyebrow, ScreenCard, ScreenHeading } from './shell';

function AccountLink({ primary }: { primary?: boolean }) {
  return (
    <Button asChild variant={primary ? 'default' : 'outline'} size="lg" className={ACTION_CLASS}>
      <Link href={ACCOUNT_HREF}>{GO_TO_ACCOUNT_LABEL}</Link>
    </Button>
  );
}

function ResumeLink({ primary, href = RESUME_HREF }: { primary?: boolean; href?: string }) {
  return (
    <Button asChild variant={primary ? 'default' : 'outline'} size="lg" className={ACTION_CLASS}>
      <Link href={href}>
        {primary && <Plus aria-hidden className="size-[1.8rem]" />}
        {CREATE_RESUME_LABEL}
      </Link>
    </Button>
  );
}

function Notice({ id, title, body, children, note }: { id: string; title: string; body: string; children: ReactNode; note?: string }) {
  return (
    <ScreenCard labelledBy={id} className="items-start gap-4">
      <Eyebrow />
      <ScreenHeading id={id}>{title}</ScreenHeading>
      <p className="m-0 text-md leading-[1.6] text-muted-foreground">{body}</p>
      <div className={`${ACTIONS_CLASS} self-stretch`}>{children}</div>
      {note && <p className="m-0 text-sm text-muted-foreground">{note}</p>}
    </ScreenCard>
  );
}

/** `resumeHref` is the new resume the user was starting before onboarding, when there is one. */
export function DoneView({ count, resumeHref }: { count: number; resumeHref?: string }) {
  return (
    <ScreenCard labelledBy="improve-done" className="items-start gap-4">
      <span className="flex size-14 items-center justify-center rounded-[1.6rem] bg-green-50 text-green-600 dark:bg-green-950">
        <Check aria-hidden className="size-7" strokeWidth={2.5} />
      </span>
      <ScreenHeading id="improve-done">{doneTitle(count)}</ScreenHeading>
      <p className="m-0 text-md leading-[1.6] text-muted-foreground">{DONE_BODY}</p>
      <div className={`${ACTIONS_CLASS} self-stretch`}>
        <ResumeLink primary href={resumeHref} />
        <AccountLink />
      </div>
    </ScreenCard>
  );
}

export function UsedView({ usedAt }: { usedAt: string | null }) {
  return (
    <Notice id="improve-used" title={USED_TITLE} body={usedBody(usedOnDate(usedAt))}>
      <AccountLink primary />
      <ResumeLink />
    </Notice>
  );
}

export function LimitView() {
  return (
    <Notice id="improve-limit" title={LIMIT_TITLE} body={limitBody(limitResetTime())} note={LATER_NOTE}>
      <AccountLink />
    </Notice>
  );
}

/** A failure the user can retry: the service was unavailable, or the account has no AI right now. */
export function RetryView({ title, message, onRetry }: { title: string; message: string; onRetry: () => void }) {
  return (
    <Notice id="improve-error" title={title} body={message} note={LATER_NOTE}>
      <Button type="button" size="lg" className={ACTION_CLASS} onClick={onRetry}>
        {TRY_AGAIN_LABEL}
      </Button>
      <AccountLink />
    </Notice>
  );
}

export function ExpiredView({ onStartAgain }: { onStartAgain: () => void }) {
  return (
    <Notice id="improve-expired" title={EXPIRED_TITLE} body={EXPIRED_BODY}>
      <Button type="button" size="lg" className={ACTION_CLASS} onClick={onStartAgain}>
        {START_AGAIN_LABEL}
      </Button>
      <AccountLink />
    </Notice>
  );
}

export function SignInView({ message }: { message: string }) {
  return (
    <Notice id="improve-sign-in" title={SIGN_IN_TITLE} body={message}>
      <Button asChild size="lg" className={ACTION_CLASS}>
        <Link href={`/auth/sign-in?next=${encodeURIComponent(IMPROVE_HREF)}`}>{SIGN_IN_LABEL}</Link>
      </Button>
    </Notice>
  );
}

/** Zero questions: the suggestions can still be requested, and that uses the free improvement. */
export function NothingToAskView({ onRequest, onStop }: { onRequest: () => void; onStop: () => void }) {
  return (
    <ScreenCard labelledBy="improve-nothing" className="gap-4">
      <Eyebrow />
      <ScreenHeading id="improve-nothing">{NOTHING_TO_ASK_TITLE}</ScreenHeading>
      <p className="m-0 text-md leading-[1.6] text-muted-foreground">{NOTHING_TO_ASK_BODY}</p>
      <p className="m-0 flex gap-2 rounded-[1rem] border border-input px-[1.4rem] py-3 text-sm leading-[1.5]">
        <Info aria-hidden className="mt-0.5 size-4 flex-none text-secondary" />
        <span>{LAST_QUESTION_NOTE}</span>
      </p>
      <div className={ACTIONS_CLASS}>
        <Button type="button" size="lg" className={ACTION_CLASS} onClick={onRequest}>
          <Sparkles aria-hidden className="size-[1.8rem]" />
          {GET_EDITS_LABEL}
        </Button>
        <Button type="button" variant="ghost" size="lg" className={ACTION_CLASS} onClick={onStop}>
          {STOP_LABEL}
        </Button>
      </div>
    </ScreenCard>
  );
}

/** Every suggestion was left out, or the service suggested none. */
export function NoEditsView({ onDone }: { onDone: () => void }) {
  return (
    <Notice id="improve-no-edits" title={NO_EDITS_TITLE} body={NO_EDITS_BODY}>
      <Button type="button" size="lg" className={ACTION_CLASS} onClick={onDone}>
        {GO_TO_ACCOUNT_LABEL}
      </Button>
    </Notice>
  );
}
