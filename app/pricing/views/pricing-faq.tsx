import Link from 'next/link';

import { DetailsList } from '@components/ui';
import {
  DAILY_RESET_ANSWER_LEAD,
  DAILY_RESET_ANSWER_TRAIL,
  DAILY_RESET_QUESTION,
  PRICING_BILLING_EMAIL,
  PRICING_BILLING_LEAD,
  PRICING_BILLING_QUESTION,
  PRICING_BILLING_TRAIL,
  PRICING_FAQ,
  PRICING_FAQ_EYEBROW,
  PRICING_FAQ_HEADING,
  PRICING_TERMS_HREF,
  PRICING_TERMS_LABEL,
} from '@/lib/pricing-page-copy';

import { LocalResetTime } from './local-reset-time';
import { PricingSectionHeading } from './pricing-section-heading';

const LINK_CLASS = 'text-foreground underline underline-offset-4';

/** The text answers, with the reset time in local time and the billing answer's links. */
const FAQ_ITEMS = PRICING_FAQ.map((item) => {
  if (item.question === DAILY_RESET_QUESTION) {
    return {
      question: item.question,
      answer: (
        <>
          {DAILY_RESET_ANSWER_LEAD} <LocalResetTime />
          {DAILY_RESET_ANSWER_TRAIL}
        </>
      ),
    };
  }
  if (item.question === PRICING_BILLING_QUESTION) {
    return {
      question: item.question,
      answer: (
        <>
          {PRICING_BILLING_LEAD}{' '}
          <Link href={PRICING_TERMS_HREF} className={LINK_CLASS}>
            {PRICING_TERMS_LABEL}
          </Link>{' '}
          {PRICING_BILLING_TRAIL}{' '}
          <a href={`mailto:${PRICING_BILLING_EMAIL}`} className={LINK_CLASS}>
            {PRICING_BILLING_EMAIL}
          </a>
          .
        </>
      ),
    };
  }
  return item;
});

/** Native `<details>` rows, as on the homepage, so the questions work by keyboard and without JavaScript. */
export function PricingFaq() {
  return (
    <section
      id="faq"
      className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:gap-16"
    >
      <PricingSectionHeading eyebrow={PRICING_FAQ_EYEBROW} title={PRICING_FAQ_HEADING} />
      <DetailsList qa={FAQ_ITEMS} openFirst />
    </section>
  );
}
