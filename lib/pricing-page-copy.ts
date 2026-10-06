import {
  CREDIT_PACKS,
  GENERATE_PDF_CREDITS,
  MONTHLY_CREDIT_ALLOWANCE,
  formatCreditPackList,
  jobSpecificPdfCount,
} from './credits';
import { PRIMARY_CTA_HREF, PRIMARY_CTA_LABEL, SECONDARY_CTA_HREF, SECONDARY_CTA_LABEL } from './homepage-copy';

// `/pricing` is served only while the `plansPage` flag is on (MDI-398). Its numbers follow the server.
const signupCredits = MONTHLY_CREDIT_ALLOWANCE.toLocaleString('en-US');
const signupPdfs = jobSpecificPdfCount(MONTHLY_CREDIT_ALLOWANCE);

export const PRICING_PATH = '/pricing';

/** Sitemap date (ISO). Change it with the copy in this file. */
export const PRICING_LAST_MODIFIED = '2026-10-05';

export const PRICING_PAGE_TITLE = 'Pay-as-you-go pricing | Talvio';

export const PRICING_PAGE_DESCRIPTION =
  `A new account starts with ${signupCredits} credits. One-time packs are ${formatCreditPackList()}. Free credits reset on the 1st of each month, and there is no subscription.`;

export const PRICING_PAGE_HEADING = 'Pay as you go';

export const PRICING_PAGE_INTRO =
  `A new account starts with ${signupCredits} credits. A new job-specific PDF costs ${GENERATE_PDF_CREDITS} credits, so that grant covers ${signupPdfs} PDFs. No card is required to begin. Packs are one-time purchases. Free credits reset to ${signupCredits} on the 1st of each month.`;

export const PRICING_FREE_HEADING = 'Free to start';

export const PRICING_FREE_BODY =
  `New accounts receive ${signupCredits} credits, enough for ${signupPdfs} new job-specific PDFs. Preview is free. No card is required to begin.`;

export const PRICING_PACKS_HEADING = 'Credit packs';

export const PRICING_CHECKOUT_NOTE =
  'Checkout is not available yet. Sign in to use the free credits on a new account. This does not start a payment.';

export const PRICING_PACK_CTA_HREF = PRIMARY_CTA_HREF;

export const PRICING_PACK_CTA_LABEL = 'Sign in';

export const PRICING_HOME_PACK_CTA_LABEL = 'See pricing';

export const PRICING_PACK_TERMS = [
  'No auto-renewal',
  'No subscription',
] as const;

export const PRICING_CREDIT_HEADING = 'What a credit is for';

export const PRICING_CREDIT_BODY =
  `The only action that spends credits is a new job-specific PDF, and that price is fixed at ${GENERATE_PDF_CREDITS} credits. Downloading a PDF you already generated does not cost more. Preview is free.`;

export const PRICING_MONTHLY_QUESTION = 'Is there a monthly plan?';

export const PRICING_MONTHLY_ANSWER =
  'No. Talvio sells one-time credit packs. There is no subscription, and packs do not renew on their own.';

export const PRICING_EXPIRY_QUESTION = 'Do unused credits disappear?';

export const PRICING_EXPIRY_ANSWER =
  `Your balance resets to ${signupCredits} credits on the 1st of each month. Unused credits do not carry over.`;

export const PRICING_BILLING_QUESTION = 'What if I have a billing question?';

export const PRICING_TERMS_HREF = '/terms';

export const PRICING_TERMS_LABEL = 'terms of service';

export const PRICING_BILLING_EMAIL = 'contact@talvio.co';

export const PRICING_BILLING_LEAD =
  'There is no subscription to cancel, and checkout is not available in the product yet. The';

export const PRICING_BILLING_TRAIL = 'do not promise a refund. For a billing question, email';

export const PRICING_BILLING_ANSWER =
  `${PRICING_BILLING_LEAD} ${PRICING_TERMS_LABEL} ${PRICING_BILLING_TRAIL} ${PRICING_BILLING_EMAIL}.`;

export const PRICING_CARD_QUESTION = 'Do I need a card to try Talvio?';

export const PRICING_CARD_ANSWER = 'No. Sign in and use the free credits. No card is required to begin.';

export const PRICING_FAQ = [
  { question: PRICING_MONTHLY_QUESTION, answer: PRICING_MONTHLY_ANSWER },
  { question: PRICING_EXPIRY_QUESTION, answer: PRICING_EXPIRY_ANSWER },
  { question: PRICING_BILLING_QUESTION, answer: PRICING_BILLING_ANSWER },
  { question: PRICING_CARD_QUESTION, answer: PRICING_CARD_ANSWER },
] as const;

export const PRICING_CLOSING_HEADING = 'Download your first resume PDF';

export const PRICING_CLOSING_BODY =
  `A new account receives ${signupCredits} credits. Preview is free, and no card is required.`;

export const PRICING_PRIMARY_CTA_HREF = PRIMARY_CTA_HREF;
export const PRICING_PRIMARY_CTA_LABEL = PRIMARY_CTA_LABEL;
export const PRICING_SECONDARY_CTA_HREF = SECONDARY_CTA_HREF;
export const PRICING_SECONDARY_CTA_LABEL = SECONDARY_CTA_LABEL;

export function pricingPackPdfLine(credits: number): string {
  return `${jobSpecificPdfCount(credits).toLocaleString('en-US')} job-specific PDFs at ${GENERATE_PDF_CREDITS} credits each`;
}

export function pricingPageText(): string {
  return [
    PRICING_PAGE_TITLE,
    PRICING_PAGE_DESCRIPTION,
    PRICING_PAGE_HEADING,
    PRICING_PAGE_INTRO,
    PRICING_FREE_HEADING,
    PRICING_FREE_BODY,
    PRICING_PACKS_HEADING,
    PRICING_CHECKOUT_NOTE,
    PRICING_PACK_CTA_LABEL,
    PRICING_HOME_PACK_CTA_LABEL,
    ...PRICING_PACK_TERMS,
    ...CREDIT_PACKS.flatMap((pack) => [
      `${pack.credits.toLocaleString('en-US')} credits`,
      pack.priceLabel,
      pricingPackPdfLine(pack.credits),
    ]),
    PRICING_CREDIT_HEADING,
    PRICING_CREDIT_BODY,
    ...PRICING_FAQ.flatMap((item) => [item.question, item.answer]),
    PRICING_CLOSING_HEADING,
    PRICING_CLOSING_BODY,
    PRICING_PRIMARY_CTA_LABEL,
    PRICING_SECONDARY_CTA_LABEL,
  ].join('\n');
}
