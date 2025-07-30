'use client';
import { Button, Card, CardContent, CardHeader, CardTitle } from "@components/ui";
import { SignInForm } from "./sign-in.form";
import { authClient } from "@lib/auth.client";
import { useRouter } from "next/navigation";

const callbackURL = `${process.env.NEXT_PUBLIC_BASE_URL}/account`;
const magicLinkCallbackURL = `${process.env.NEXT_PUBLIC_BASE_URL}/account`;
const magicLinkRedirectURL = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/verify-request`;
const magicLinkErrorURL = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/error`;

export default function SignInPage() {
  const router = useRouter();

  const handleEmailSignIn = async ({ email }: { email: string }) => {
    await authClient.signIn.magicLink({ email, callbackURL: magicLinkCallbackURL, newUserCallbackURL: `${magicLinkCallbackURL}/new`, errorCallbackURL: magicLinkErrorURL });
    router.push(magicLinkRedirectURL);
  }

  return (
    <section className="flex flex-col items-center justify-center h-screen">
      <Card className="w-full max-w-96">
        <CardHeader>
          <CardTitle className="text-primary text-2xl font-semibold text-center">Sign in</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button onClick={() => authClient.signIn.social({ provider: 'google', callbackURL })} variant={'outline'}>Google</Button>
          <Button onClick={() => authClient.signIn.social({ provider: 'linkedin', callbackURL })} variant={'outline'}>LinkedIn</Button>
          <SignInForm onSubmit={handleEmailSignIn} />
        </CardContent>
      </Card>
    </section>
  )
}
