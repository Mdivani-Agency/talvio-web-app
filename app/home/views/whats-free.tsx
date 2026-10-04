import { Button, Card } from '@components/ui';
import { PRIMARY_CTA_HREF, PRIMARY_CTA_LABEL, WHATS_FREE_BODY } from '@/lib/homepage-copy';
import Link from 'next/link';

/** Replaces the old credit-pack cards. States the monthly allowance once, where it applies. */
export const WhatsFree = () => {
  return (
    <Card className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-6 py-10 text-center lg:px-12">
      <p className="text-md text-muted-foreground lg:text-lg">{WHATS_FREE_BODY}</p>
      <Button asChild size={'lg'}>
        <Link href={PRIMARY_CTA_HREF}>{PRIMARY_CTA_LABEL}</Link>
      </Button>
    </Card>
  );
};
