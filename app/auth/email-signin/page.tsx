"use client";
import { Loading } from "@components/views";
import { authClient } from "@lib/auth.client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect } from "react";

export default function EmailSignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const callbackURL = searchParams.get('callbackURL');

  const verify = useCallback(async (token: string, callbackURL: string) => {
    await authClient.magicLink.verify({ query: { token} });
    router.replace(callbackURL);
  }, [router]);

  useEffect(() => {
    if (token) {
      verify(token, decodeURIComponent(callbackURL || '/account'));
    }
  }, [token, callbackURL, verify]);

  return <Suspense fallback={<Loading message={'Verifying your token...'} />}>
    <Loading message={'Verifying your token...'} />
  </Suspense>;
}
