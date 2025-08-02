'use client';

import { Button } from '@components/ui/button';
import { Icon } from '@components/icons';
import Link from 'next/link';

export default function VerifyRequestPage() {

  return (
    <section className={'container bg-card flex flex-col gap-4 justify-center items-center w-full mx-auto p-6 rounded-md'}>
      <Icon type={'VerifyEmail'} className={'size-124'} />
      <h1 className="text-secondary-900 text-xl font-semibold">Check Your Email!</h1>
      <p className="text-lg text-center text-foreground">
        We’ve just sent you an email, Tap on the link to verify your account
      </p>
      <Link className="w-full max-w-96" href={'/'}>
        <Button className={'w-full'} variant={'default'}>
          Back to Home
        </Button>
      </Link>
    </section>
  );
}
