import Link from 'next/link';

import { Button } from '@components/ui';
import { PageContainer } from '@components/views';
import {
  PRICING_CLOSING_BODY,
  PRICING_CLOSING_HEADING,
  PRICING_EYEBROW,
  PRICING_PAGE_HEADING,
  PRICING_PAGE_INTRO,
  PRICING_PRIMARY_CTA_HREF,
  PRICING_PRIMARY_CTA_LABEL,
  PRICING_SECONDARY_CTA_HREF,
  PRICING_SECONDARY_CTA_LABEL,
} from '@/lib/pricing-page-copy';

import { PdfCounts } from './views/pdf-counts';
import { PlanCards } from './views/plan-cards';
import { PricingFaq } from './views/pricing-faq';

/** Served only while the `plansPage` flag is on; otherwise `/pricing` redirects to the homepage (`lib/public-entry.ts`). */
export default function PricingPage() {
  return (
    <PageContainer as="main" className="flex flex-col gap-14 pb-14 text-primary lg:gap-24 lg:pb-24">
      <header className="pt-10 md:text-center lg:pt-24">
        <p className="mb-3 text-md font-semibold text-secondary dark:text-secondary-hover">{PRICING_EYEBROW}</p>
        <h1 className="mx-auto max-w-[76rem] text-[3rem] leading-[1.2] font-semibold lg:text-3xl">{PRICING_PAGE_HEADING}</h1>
        <p className="mx-auto mt-4 max-w-[64rem] text-md leading-[1.556] text-muted-foreground lg:text-lg">
          {PRICING_PAGE_INTRO}
        </p>
      </header>

      <PlanCards />
      <PdfCounts />
      <PricingFaq />

      <section
        aria-labelledby="closing-heading"
        className="flex flex-col items-stretch gap-4 rounded-[2.4rem] bg-card px-5 py-8 md:items-center md:text-center lg:p-14"
      >
        <h2 id="closing-heading" className="text-[2.6rem] leading-[1.333] font-semibold lg:text-2xl">
          {PRICING_CLOSING_HEADING}
        </h2>
        <p className="max-w-[56rem] text-md leading-[1.556] text-muted-foreground lg:text-lg">{PRICING_CLOSING_BODY}</p>
        <div className="mt-2 flex flex-col gap-3 md:flex-row">
          <Button asChild className="h-[4.8rem] px-6 text-md font-semibold">
            <Link href={PRICING_PRIMARY_CTA_HREF}>{PRICING_PRIMARY_CTA_LABEL}</Link>
          </Button>
          <Button asChild variant="outline" className="h-[4.8rem] border-input px-6 text-md">
            <Link href={PRICING_SECONDARY_CTA_HREF}>{PRICING_SECONDARY_CTA_LABEL}</Link>
          </Button>
        </div>
      </section>
    </PageContainer>
  );
}
