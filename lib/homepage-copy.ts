import { ACCOUNT_DELETION_ANSWER, DATA_SAFETY_ANSWER, SUPPORT_ANSWER } from './public-claims';

/**
 * Homepage copy. Lines marked "as written" come from the messaging brief on MDI-322.
 * Copy that states the monthly allowance ships with MDI-320.
 */

/** Sitemap date (ISO). Change it with the homepage copy. */
export const HOME_LAST_MODIFIED = '2026-10-04';

/** New visitors sign in here. There is no separate sign-up route. */
export const PRIMARY_CTA_HREF = '/auth/sign-in';
export const PRIMARY_CTA_LABEL = 'Start free';
export const SECONDARY_CTA_HREF = '/templates';
export const SECONDARY_CTA_LABEL = 'See templates';

// As written.
export const HERO_BADGE = 'Talvio Beta';
export const HERO_TITLE = 'Free PDF resume generator';
export const HERO_BODY =
  'Write your experience once, pick a template, and download a clean resume PDF. Free forever, no card needed.';

export const WORKFLOW_TITLE = 'From your profile to a resume PDF';

export const WORKFLOW_STEPS = [
  {
    title: 'Sign in',
    body: 'Use an email code or Google. Signing in creates your account.',
  },
  {
    title: 'Add your experience',
    body: 'Type it in, or start from a resume PDF you already have.',
  },
  {
    title: 'Download your resume',
    body: 'Choose a template, check the preview, and download the PDF.',
  },
] as const;

// Supporting line from the brief, as written. One pillar per card; "Free forever" has its own section.
export const BENEFITS_TITLE = 'Write your experience once. Reuse it in every resume.';

export const BENEFITS = [
  {
    title: 'Write it once',
    body: "Each new resume starts from your profile, not from a blank page or last year's file.",
  },
  {
    title: 'A layout that fits',
    body: 'Pick a template for your experience level and preview it before you download.',
  },
  {
    title: 'You stay in control',
    body: 'Answer a few optional questions to get suggested edits, or skip them.',
  },
] as const;

/** Replaces the old "Pay as you go" section. The navigation label is "What's free". */
export const WHATS_FREE_ID = 'whats-free';
export const WHATS_FREE_NAME = "What's free";
export const WHATS_FREE_TITLE = '3 new resume PDFs every month';
// As written.
export const WHATS_FREE_BODY =
  'Every account can create 3 new resume PDFs each month, free forever. Edits, previews and downloading a resume again do not count. The count resets on the 1st.';

export const FAQ_TITLE = 'Frequently asked questions';

export type FaqItem = { question: string; answer: string };

/** The first six answers are as written in the brief. The last three are trimmed to the word budget. */
export const HOME_FAQ: readonly FaqItem[] = [
  {
    question: 'Is Talvio really free?',
    answer:
      'Yes, and it stays free. Every account can create 3 new resume PDFs each month, forever. No card is needed, and it is not a trial.',
  },
  {
    question: 'How many resumes can I create?',
    answer: '3 new resume PDFs each month. The count resets on the 1st at 00:00 UTC. Unused ones do not carry over.',
  },
  {
    question: 'What counts toward the 3?',
    answer:
      'Only creating a new PDF. Drafts, edits, previews and downloading a PDF you already made do not count. A new PDF from an edited resume counts as one. A failed attempt does not count.',
  },
  {
    question: 'What happens when I reach the limit?',
    answer:
      'You can keep editing, previewing and downloading the PDFs you already made. You can create new ones again on the 1st of next month.',
  },
  {
    question: 'What does beta mean?',
    answer:
      'Talvio is new. The core tools work today, and more features are on the way. If something goes wrong, email contact@talvio.co.',
  },
  {
    question: 'Does Talvio use AI?',
    answer:
      'Optional questions during setup can suggest edits to your profile. You choose what to keep, and you can skip them.',
  },
  { question: 'Is my data safe?', answer: DATA_SAFETY_ANSWER },
  { question: 'How do I close my account?', answer: ACCOUNT_DELETION_ANSWER },
  { question: 'How do I get support?', answer: SUPPORT_ANSWER },
];

// As written.
export const CTA_TITLE = 'Start your first resume';
export const CTA_BODY = 'Free forever, no card needed. Talvio is in beta, and more features are on the way.';

/** Every visible line on the homepage, for the copy tests. */
export function homepageCopyText(): string {
  return [
    HERO_BADGE,
    HERO_TITLE,
    HERO_BODY,
    PRIMARY_CTA_LABEL,
    SECONDARY_CTA_LABEL,
    WORKFLOW_TITLE,
    ...WORKFLOW_STEPS.flatMap((step) => [step.title, step.body]),
    BENEFITS_TITLE,
    ...BENEFITS.flatMap((benefit) => [benefit.title, benefit.body]),
    WHATS_FREE_NAME,
    WHATS_FREE_TITLE,
    WHATS_FREE_BODY,
    FAQ_TITLE,
    ...HOME_FAQ.flatMap((item) => [item.question, item.answer]),
    CTA_TITLE,
    CTA_BODY,
  ].join('\n');
}
