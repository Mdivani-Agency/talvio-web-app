/** Display-only mirror of `credit_prices.generate_pdf`. Never sent to the server. */
export const GENERATE_PDF_CREDITS = 30;

/**
 * Display-only mirror of `monthly_credit_allowance()`: the balance every account gets at signup and on the
 * 1st of each month (MDI-320). Never sent to the server.
 */
export const MONTHLY_CREDIT_ALLOWANCE = 90;

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
