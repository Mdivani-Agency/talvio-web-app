'use client';

import { Icon } from '@components/icons';
import { Button, Card, CardContent, CardHeader, CardTitle, Separator } from '@components/ui';
import { createSupabaseBrowserClient } from '@lib/supabase/client';
import { Loading } from '@components/views';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { toast } from 'sonner';

import { SignInForm } from './sign-in.form';

function callbackPath(raw: string | null) {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) {
    return '/account';
  }
  return raw;
}

function SignInPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = callbackPath(searchParams.get('callbackURL') ?? searchParams.get('next'));

  const redirectTo = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback?next=${encodeURIComponent(next)}`;

  const handleEmailSignIn = async ({ email }: { email: string }) => {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    router.push('/auth/verify-request');
  };

  const handleOAuth = async (provider: 'google' | 'linkedin_oidc') => {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.url) {
      window.location.assign(data.url);
    }
  };

  return (
    <section className="flex flex-col items-center justify-center h-screen">
      <Card className="w-full max-w-96">
        <CardHeader>
          <CardTitle className="text-primary text-xl font-semibold text-center">
            Access your account
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button
            className="bg-[#FEFEFF] text-[#0d0d0d] flex items-center gap-2"
            onClick={() => void handleOAuth('google')}
            variant={'outline'}
          >
            <Icon type="Google" className="size-4" /> Continue with Google
          </Button>
          <Button
            className="bg-[#0B66C2] text-white flex items-center gap-2"
            onClick={() => void handleOAuth('linkedin_oidc')}
            variant={'outline'}
          >
            <Icon type="LinkedIn" className="size-4" /> Continue with Linkedin
          </Button>
          <div className="flex items-center gap-2">
            <Separator className="flex-1" />
            <span className="text-sm text-muted-foreground px-2">or</span>
            <Separator className="flex-1" />
          </div>
          <SignInForm onSubmit={handleEmailSignIn} />
        </CardContent>
      </Card>
    </section>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<Loading message={'Loading...'} />}>
      <SignInPageContent />
    </Suspense>
  );
}
