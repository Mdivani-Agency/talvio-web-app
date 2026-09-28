/** Display-only mirror of `credit_prices.generate_pdf`. Never sent to the server. */
export const GENERATE_PDF_CREDITS = 30;

/** Display-only mirror of the `handle_new_user` signup grant. */
export const SIGNUP_CREDIT_GRANT = 300;

export type CreditPack = {
  credits: number;
  priceLabel: string;
};

/**
 * Public pack catalog shared by the homepage cards and FAQ.
 * These prices are not loaded from a payment provider. Checkout is not wired.
 */
export const CREDIT_PACKS: readonly CreditPack[] = [
  { credits: 300, priceLabel: '$2.99' },
  { credits: 600, priceLabel: '$4.99' },
  { credits: 3000, priceLabel: '$9.99' },
];

export function jobSpecificPdfCount(credits: number): number {
  if (!Number.isInteger(credits) || credits < GENERATE_PDF_CREDITS || credits % GENERATE_PDF_CREDITS !== 0) {
    throw new Error(`credits must be a positive multiple of ${GENERATE_PDF_CREDITS}`);
  }

  return credits / GENERATE_PDF_CREDITS;
}

function joinWithAnd(items: readonly string[]): string {
  if (items.length <= 1) {
    return items[0] ?? '';
  }

  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

export function formatCreditPackList(packs: readonly CreditPack[] = CREDIT_PACKS): string {
  return joinWithAnd(packs.map((pack) => `${pack.credits.toLocaleString('en-US')} credits (${pack.priceLabel})`));
}

export const FREE_CREDITS_ANSWER = `New accounts receive ${SIGNUP_CREDIT_GRANT.toLocaleString('en-US')} credits. A new job-specific PDF costs ${GENERATE_PDF_CREDITS} credits, so that grant covers ${jobSpecificPdfCount(SIGNUP_CREDIT_GRANT)} PDFs. No credit card is required. Downloading a PDF you already generated does not use more credits.`;

export const MORE_CREDITS_ANSWER = `One-time packs are ${formatCreditPackList()}. At ${GENERATE_PDF_CREDITS} credits per new job-specific PDF, those packs cover ${joinWithAnd(CREDIT_PACKS.map((pack) => String(jobSpecificPdfCount(pack.credits))))} PDFs. Credits do not expire, and packs do not renew automatically.`;

export const SUBSCRIPTION_QUESTION = 'Will I be charged on a subscription?';

export const SUBSCRIPTION_ANSWER =
  'No. Talvio does not sell subscriptions, and credit packs do not renew on their own. Unused credits stay on your account. For a billing issue, email contact@talvio.co.';
