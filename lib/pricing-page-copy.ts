import { PRIMARY_CTA_HREF, PRIMARY_CTA_LABEL, SECONDARY_CTA_HREF, SECONDARY_CTA_LABEL } from './homepage-copy';
import { CONTACT_EMAIL } from './legal-copy';

// `/pricing` is served only while the `plansPage` flag is on (MDI-398). Paid plans are not on sale yet (MDI-321):
// their cards show Coming soon, and nothing on the page starts a payment. The page counts resume PDFs, never credits.

export const PRICING_PATH = '/pricing';

/** Sitemap date (ISO). Change it with the copy in this file. */
export const PRICING_LAST_MODIFIED = '2026-11-19';

export const PRICING_PAGE_TITLE = 'Pricing: free plan and monthly plans | Talvio';

export const PRICING_PAGE_DESCRIPTION =
  'Every Talvio account gets 3 new resume PDFs a month, free forever. Monthly plans with a daily limit are coming soon.';

export const PRICING_NAV_NAME = 'Pricing';

export const PRICING_EYEBROW = 'Pricing';
export const PRICING_PAGE_HEADING = 'Start free. Upgrade when you apply more.';
export const PRICING_PAGE_INTRO =
  'Every account gets 3 new resume PDFs a month, free forever. Paid plans give you a daily limit for busy weeks of applying. They are coming soon.';

/** The daily count of a paid plan resets at this hour, UTC, like the monthly free count. */
export const DAILY_RESET_UTC_HOUR = 0;

/** The reset time before the browser can show it in local time, and for visitors without JavaScript. */
export const DAILY_RESET_UTC_LABEL = '00:00 UTC';

/**
 * The daily reset in the visitor's local time, such as "4:00 AM" in UTC+4.
 * `locale` and `timeZone` default to the browser's; tests pass them.
 */
export function formatDailyResetTime(locale?: string, timeZone?: string): string {
  const reset = new Date(Date.UTC(2026, 0, 1, DAILY_RESET_UTC_HOUR, 0));
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone }).format(reset);
}

/** "4:00 AM your time" once the local time is known. */
export function localResetLabel(time: string): string {
  return `${time} your time`;
}

export const PLANS_HEADING = 'Plans';
export const PLAN_PER_MONTH = '/ month';
export const PLAN_RECOMMENDED = 'Recommended';
export const PLAN_COMING_SOON = 'Coming soon';
export const PLAN_RESET_LEAD = 'Daily count resets at';
export const PLANS_NOTE = 'Subscriptions are not available yet. Nothing on this page starts a payment.';

export type FreePlan = {
  kind: 'free';
  name: string;
  summary: string;
  price: string;
  priceNote: string;
  features: readonly string[];
  cta: { label: string; href: string };
};

export type PaidPlan = {
  kind: 'paid';
  name: string;
  summary: string;
  price: string;
  /** The first line: the plan's daily limit. */
  limit: string;
  recommended: boolean;
};

/** Lines every paid card shows after its limit and the reset time. */
export const PAID_PLAN_FEATURES = [
  'Edits, previews and re-downloads free',
  'Every template',
  'Billed monthly, cancel any time',
] as const;

/** The plans, in card order. MDI-608 swaps Coming soon on the paid cards for a Subscribe button. */
export const PRICING_PLANS: readonly [FreePlan, ...PaidPlan[]] = [
  {
    kind: 'free',
    name: 'Free',
    summary: '3 new resume PDFs a month',
    price: '$0',
    priceNote: 'forever',
    features: ['3 new resume PDFs every month', 'Resets on the 1st', 'Edits, previews and re-downloads free', 'Every template'],
    cta: { label: PRIMARY_CTA_LABEL, href: PRIMARY_CTA_HREF },
  },
  {
    kind: 'paid',
    name: 'Pro',
    summary: 'Up to 5 new resume PDFs a day',
    price: '$9.99',
    limit: 'Up to 5 new PDFs every day',
    recommended: false,
  },
  {
    kind: 'paid',
    name: 'Max',
    summary: 'Up to 10 new resume PDFs a day',
    price: '$14.99',
    limit: 'Up to 10 new PDFs every day',
    recommended: true,
  },
  {
    kind: 'paid',
    name: 'Ultra',
    summary: 'No daily limit on new resume PDFs',
    price: '$29.99',
    limit: 'Unlimited new PDFs, fair use applies',
    recommended: false,
  },
];

export const COUNTS_HEADING = 'What counts as a new PDF';
export const COUNTS_AS_ONE = { badge: '1', title: 'Counts as one', items: ['Creating a new PDF', 'A new PDF of an edited resume'] } as const;
export const ALWAYS_FREE = {
  badge: '0',
  title: 'Always free',
  items: ['Drafts, edits and previews', 'Downloading a PDF you already made', 'A failed attempt'],
} as const;

export const PRICING_FAQ_EYEBROW = 'FAQ';
export const PRICING_FAQ_HEADING = 'Pricing questions';

export const DAILY_RESET_QUESTION = 'When does the daily count reset?';
export const DAILY_RESET_ANSWER_LEAD = 'Every day at';
export const DAILY_RESET_ANSWER_TRAIL = '. Unused PDFs do not carry over to the next day.';

export const PRICING_BILLING_QUESTION = 'What if I have a billing question?';
export const PRICING_BILLING_LEAD = 'Subscriptions are not available yet, so there is nothing to cancel. The';
export const PRICING_TERMS_HREF = '/terms';
export const PRICING_TERMS_LABEL = 'terms of service';
export const PRICING_BILLING_TRAIL = 'do not promise a refund. For a billing question, email';
export const PRICING_BILLING_EMAIL = CONTACT_EMAIL;

/** Answers in plain text. The page renders the daily reset in local time and the billing answer with links. */
export const PRICING_FAQ = [
  {
    question: 'Is Talvio really free?',
    answer:
      'Yes, and it stays free. Every account can create 3 new resume PDFs each month, forever. No card is needed, and it is not a trial.',
  },
  {
    question: 'When does the free count reset?',
    answer: 'On the 1st of each month at 00:00 UTC. Unused free PDFs do not carry over.',
  },
  {
    question: 'What happens when I reach the limit?',
    answer:
      'You can keep editing, previewing and downloading the PDFs you already made. You can create new ones again on the 1st of next month, or move to a paid plan.',
  },
  {
    question: 'How do the paid plans work?',
    answer:
      'Pro, Max and Ultra are monthly subscriptions. Instead of 3 new PDFs a month, you get a daily limit: 5 a day on Pro, 10 a day on Max, and no limit on Ultra.',
  },
  {
    question: DAILY_RESET_QUESTION,
    answer: `${DAILY_RESET_ANSWER_LEAD} ${DAILY_RESET_UTC_LABEL}${DAILY_RESET_ANSWER_TRAIL}`,
  },
  {
    question: 'What does unlimited mean on Ultra?',
    answer:
      'Ultra has no daily limit on new resume PDFs. Fair use applies: automated or abusive use can be limited, as the terms of service will set out.',
  },
  { question: 'Can I cancel?', answer: 'Yes. Plans are billed monthly, and you can cancel any time.' },
  {
    question: PRICING_BILLING_QUESTION,
    answer: `${PRICING_BILLING_LEAD} ${PRICING_TERMS_LABEL} ${PRICING_BILLING_TRAIL} ${PRICING_BILLING_EMAIL}.`,
  },
] as const;

export const PRICING_CLOSING_HEADING = 'Download your first resume PDF';
export const PRICING_CLOSING_BODY = 'Free forever, no card needed. Talvio is in beta, and more features are on the way.';

export const PRICING_PRIMARY_CTA_HREF = PRIMARY_CTA_HREF;
export const PRICING_PRIMARY_CTA_LABEL = PRIMARY_CTA_LABEL;
export const PRICING_SECONDARY_CTA_HREF = SECONDARY_CTA_HREF;
export const PRICING_SECONDARY_CTA_LABEL = SECONDARY_CTA_LABEL;

/** Every visible line on the page, with the reset time as rendered on the server, for the copy tests. */
export function pricingPageText(): string {
  const [free, ...paid] = PRICING_PLANS;
  return [
    PRICING_PAGE_TITLE,
    PRICING_PAGE_DESCRIPTION,
    PRICING_EYEBROW,
    PRICING_PAGE_HEADING,
    PRICING_PAGE_INTRO,
    free.name,
    free.summary,
    `${free.price} ${free.priceNote}`,
    ...free.features,
    free.cta.label,
    ...paid.flatMap((plan) => [
      plan.name,
      plan.summary,
      `${plan.price} ${PLAN_PER_MONTH}`,
      plan.limit,
      `${PLAN_RESET_LEAD} ${DAILY_RESET_UTC_LABEL}`,
      ...PAID_PLAN_FEATURES,
      PLAN_COMING_SOON,
      plan.recommended ? PLAN_RECOMMENDED : '',
    ]),
    PLANS_NOTE,
    COUNTS_HEADING,
    COUNTS_AS_ONE.title,
    ...COUNTS_AS_ONE.items,
    ALWAYS_FREE.title,
    ...ALWAYS_FREE.items,
    PRICING_FAQ_EYEBROW,
    PRICING_FAQ_HEADING,
    ...PRICING_FAQ.flatMap((item) => [item.question, item.answer]),
    PRICING_CLOSING_HEADING,
    PRICING_CLOSING_BODY,
    PRICING_PRIMARY_CTA_LABEL,
    PRICING_SECONDARY_CTA_LABEL,
  ]
    .filter(Boolean)
    .join('\n');
}
