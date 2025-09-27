'use client';
import { Button, Card, CardContent, CardHeader, CardTitle, Separator } from "@components/ui";
import { SignInForm } from "./sign-in.form";
import { authClient } from "@lib/auth.client";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@components/icons";

const magicLinkRedirectURL = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/verify-request`;
const magicLinkErrorURL = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/error`;

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = searchParams.get('callbackURL') || '/account';

  const callbackURL = `${process.env.NEXT_PUBLIC_BASE_URL}${pathname}`;

  const handleEmailSignIn = async ({ email }: { email: string }) => {
    await authClient.signIn.magicLink({ email, callbackURL, errorCallbackURL: magicLinkErrorURL });
    router.push(magicLinkRedirectURL);
  }

  return (
    <section className="flex flex-col items-center justify-center h-screen">
      <Card className="w-full max-w-96">
        <CardHeader>
          <CardTitle className="text-primary text-xl font-semibold text-center">Access your account</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button className="bg-[#FEFEFF] text-[#0d0d0d] flex items-center gap-2" onClick={() => authClient.signIn.social({ provider: 'google', callbackURL })} variant={'outline'}>
            <Icon type="Google" className="size-4" /> Continue with Google
          </Button>
          <Button className="bg-[#0B66C2] text-white flex items-center gap-2" onClick={() => authClient.signIn.social({ provider: 'linkedin', callbackURL })} variant={'outline'}>
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
  )
}
