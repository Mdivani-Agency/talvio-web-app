'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { Icon } from '@components/icons';
import { Button } from '@components/ui';
import { Loading } from '@components/views';
import { createSupabaseBrowserClient } from '@lib/supabase/client';
import { safeRedirectPath } from '@/lib/auth/safe-redirect-path';
import { signInErrorMessage } from '@/lib/auth/sign-in-error';
import { signInSearchParams } from '@/lib/auth/sign-in-href';
import {
  SIGN_IN_AGREEMENT,
  SIGN_IN_DIVIDER,
  SIGN_IN_GOOGLE_LABEL,
  SIGN_IN_HEADING,
  SIGN_IN_INTRO,
  SIGN_IN_LINKEDIN_NOTE,
} from '@/lib/sign-in-copy';

import { AuthAlert } from '../views/auth-alert';
import { AuthCard, AuthPage } from '../views/auth-card';
import { SignInForm } from './sign-in.form';

function authRedirectTo(next: string) {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

const legalLinkClassName = 'text-secondary underline underline-offset-[0.3rem] dark:text-secondary-hover';

function SignInPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeRedirectPath(signInSearchParams(searchParams));
  const [alert, setAlert] = useState<string>();

  const handleEmailSignIn = async ({ email }: { email: string }) => {
    setAlert(undefined);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: authRedirectTo(next) },
    });
    if (error) {
      setAlert(signInErrorMessage(error));
      return;
    }
    router.push('/auth/verify-request');
  };

  const handleGoogleSignIn = async () => {
    setAlert(undefined);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: authRedirectTo(next) },
    });
    if (error) {
      setAlert(signInErrorMessage(error));
    }
  };

  return (
    <AuthPage>
      <AuthCard>
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-xl leading-[1.333] font-semibold text-primary">{SIGN_IN_HEADING}</h1>
          <p className="text-md text-muted-foreground">{SIGN_IN_INTRO}</p>
        </div>
        {alert ? <AuthAlert>{alert}</AuthAlert> : null}
        <Button
          type="button"
          variant="outline"
          onClick={() => void handleGoogleSignIn()}
          className="h-12 w-full gap-2.5 border-input bg-background text-md text-foreground dark:bg-background"
        >
          <Icon type="Google" className="size-[1.8rem]" /> {SIGN_IN_GOOGLE_LABEL}
        </Button>
        <div aria-hidden="true" className="flex items-center gap-3 text-md text-muted-foreground">
          <span className="h-px flex-1 bg-input" />
          {SIGN_IN_DIVIDER}
          <span className="h-px flex-1 bg-input" />
        </div>
        <SignInForm onSubmit={handleEmailSignIn} onValuesChange={() => setAlert(undefined)} />
        <p className="text-center text-md leading-[1.4] text-muted-foreground">{SIGN_IN_LINKEDIN_NOTE}</p>
      </AuthCard>
      <p className="mt-5 max-w-[44rem] text-center text-md leading-[1.4] text-muted-foreground">
        {SIGN_IN_AGREEMENT.before}
        <Link href={SIGN_IN_AGREEMENT.terms.href} className={legalLinkClassName}>
          {SIGN_IN_AGREEMENT.terms.label}
        </Link>
        {SIGN_IN_AGREEMENT.between}
        <Link href={SIGN_IN_AGREEMENT.privacy.href} className={legalLinkClassName}>
          {SIGN_IN_AGREEMENT.privacy.label}
        </Link>
        {SIGN_IN_AGREEMENT.after}
      </p>
    </AuthPage>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<Loading message={'Loading...'} />}>
      <SignInPageContent />
    </Suspense>
  );
}
