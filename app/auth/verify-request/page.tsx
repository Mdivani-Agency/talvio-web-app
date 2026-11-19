'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';

import { Button } from '@components/ui';
import { createSupabaseBrowserClient } from '@lib/supabase/client';
import { authCallbackUrl, resendSecondsLeft, savePendingSignIn } from '@/lib/auth/pending-sign-in';
import { signInErrorMessage } from '@/lib/auth/sign-in-error';
import { signInHref } from '@/lib/auth/sign-in-href';
import {
  RESEND_COOLDOWN_SECONDS,
  resendCountdownLabel,
  VERIFY_DIFFERENT_EMAIL,
  VERIFY_HEADING,
  VERIFY_RESEND_HINT,
  VERIFY_RESEND_LABEL,
  VERIFY_RESENT,
  VERIFY_SAME_BROWSER,
  VERIFY_SENT_GENERIC,
  VERIFY_SENT_TO,
} from '@/lib/sign-in-copy';

import { usePendingSignIn } from '../hooks/use-pending-sign-in';
import { AuthAlert } from '../views/auth-alert';
import { AuthCard, AuthPage } from '../views/auth-card';

/** Seconds until another link may be sent, ticking once a second while it is above zero. */
function useResendSecondsLeft(sentAt: number | undefined) {
  const [now, setNow] = useState(() => Date.now());
  const secondsLeft = sentAt === undefined ? 0 : resendSecondsLeft(sentAt, now, RESEND_COOLDOWN_SECONDS);
  const counting = secondsLeft > 0;
  useEffect(() => {
    if (!counting) {
      return;
    }
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [counting]);
  return secondsLeft;
}

export default function VerifyRequestPage() {
  const pending = usePendingSignIn();
  const [sending, setSending] = useState(false);
  const [alert, setAlert] = useState<string>();
  const [resent, setResent] = useState(false);
  // A resend saves a new send time; the re-render reads it back from storage and the countdown restarts.
  const secondsLeft = useResendSecondsLeft(pending?.sentAt);
  const next = pending?.next ?? '/account';

  const resend = async () => {
    if (!pending) {
      return;
    }
    setSending(true);
    setAlert(undefined);
    setResent(false);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: pending.email,
      options: { emailRedirectTo: authCallbackUrl(window.location.origin, pending.next) },
    });
    setSending(false);
    if (error) {
      setAlert(signInErrorMessage(error));
      return;
    }
    savePendingSignIn({ ...pending, sentAt: Date.now() });
    setResent(true);
  };

  return (
    <AuthPage>
      <AuthCard>
        <span
          aria-hidden="true"
          className="flex size-16 items-center justify-center self-center rounded-lg bg-popover text-secondary dark:bg-accent dark:text-secondary-hover"
        >
          <Mail className="size-[3rem]" strokeWidth={1.75} />
        </span>
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-xl leading-[1.333] font-semibold text-primary">{VERIFY_HEADING}</h1>
          <p className="text-md text-foreground">
            {pending ? (
              <>
                {VERIFY_SENT_TO.before}
                <strong className="font-semibold break-all">{pending.email}</strong>
                {VERIFY_SENT_TO.after}
              </>
            ) : (
              VERIFY_SENT_GENERIC
            )}
          </p>
          <p className="text-md text-muted-foreground">{VERIFY_SAME_BROWSER}</p>
        </div>
        {alert ? <AuthAlert>{alert}</AuthAlert> : null}
        <div className="flex flex-col gap-3 border-t border-input pt-6">
          {pending ? (
            <>
              <p className="text-center text-md leading-[1.4] text-muted-foreground">{VERIFY_RESEND_HINT}</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => void resend()}
                disabled={sending || secondsLeft > 0}
                className="h-12 w-full border-input bg-background text-md dark:bg-background"
              >
                {secondsLeft > 0 ? resendCountdownLabel(secondsLeft) : VERIFY_RESEND_LABEL}
              </Button>
            </>
          ) : null}
          <p role="status" className="text-center text-md text-foreground empty:hidden">
            {resent ? VERIFY_RESENT : null}
          </p>
          <Link
            href={signInHref(next)}
            className="inline-flex min-h-[4.4rem] items-center self-center text-md font-medium text-secondary underline underline-offset-[0.3rem] dark:text-secondary-hover"
          >
            {VERIFY_DIFFERENT_EMAIL}
          </Link>
        </div>
      </AuthCard>
    </AuthPage>
  );
}
