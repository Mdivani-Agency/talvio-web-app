import { Link2Off } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@components/ui';
import { type LinkErrorSearchParams, linkErrorCode, linkErrorSignInHref } from '@/lib/auth/link-error';
import {
  LINK_ERROR_BACK_LABEL,
  LINK_ERROR_BODY,
  LINK_ERROR_HEADING,
  LINK_ERROR_HOME_LABEL,
  linkErrorCodeLabel,
} from '@/lib/sign-in-copy';

import { AuthCard, AuthPage } from '../views/auth-card';

export default async function AuthErrorPage({ searchParams }: { searchParams: Promise<LinkErrorSearchParams> }) {
  const params = await searchParams;
  const code = linkErrorCode(params);

  return (
    <AuthPage>
      <AuthCard>
        <span
          aria-hidden="true"
          className="flex size-16 items-center justify-center self-center rounded-lg bg-popover text-destructive dark:bg-accent"
        >
          <Link2Off className="size-[3rem]" strokeWidth={1.75} />
        </span>
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-xl leading-[1.333] font-semibold text-primary">{LINK_ERROR_HEADING}</h1>
          <p className="text-md text-muted-foreground">{LINK_ERROR_BODY}</p>
        </div>
        <div className="flex flex-col gap-3">
          <Button asChild className="h-12 w-full text-md">
            <Link href={linkErrorSignInHref(params)}>{LINK_ERROR_BACK_LABEL}</Link>
          </Button>
          <Button asChild variant="ghost" className="h-12 w-full text-md">
            <Link href="/">{LINK_ERROR_HOME_LABEL}</Link>
          </Button>
          {code ? <p className="text-center text-xs text-muted-foreground">{linkErrorCodeLabel(code)}</p> : null}
        </div>
      </AuthCard>
    </AuthPage>
  );
}
