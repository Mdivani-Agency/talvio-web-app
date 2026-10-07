import { GENERATE_PDF_CREDITS, SIGNUP_CREDIT_GRANT } from './credits';

const signupCredits = SIGNUP_CREDIT_GRANT.toLocaleString('en-US');

/** New visitors sign in here. There is no separate sign-up route. */
export const PRIMARY_CTA_HREF = '/auth/sign-in';
export const PRIMARY_CTA_LABEL = 'Start free';
export const SECONDARY_CTA_HREF = '/templates';
export const SECONDARY_CTA_LABEL = 'See templates';

export const HERO_TITLE = 'Keep one profile and download a resume PDF';
export const HERO_BODY = `Sign in, type your profile or import a PDF, pick a template, and download the resume. A new account starts with ${signupCredits} credits. No card is required.`;

export const WORKFLOW_TITLE = 'Build a resume from one profile';

export const WORKFLOW_STEPS = [
  {
    title: 'Sign in',
    body: `Use an email code or Google. A new account receives ${signupCredits} credits.`,
  },
  {
    title: 'Add your profile',
    body: 'Type it in, or start from a parsed PDF. Optional questions can suggest edits, and you can continue without them.',
  },
  {
    title: 'Download a PDF',
    body: `Pick a template and preview it for free. A new PDF costs ${GENERATE_PDF_CREDITS} credits. Downloading a PDF you already generated does not cost more.`,
  },
] as const;

export const BENEFITS_TITLE = 'A profile, a template, and a PDF';

export const BENEFITS = [
  {
    title: 'One profile you can reuse',
    body: 'Type your details or import a PDF, then use that profile when you build a resume.',
  },
  {
    title: 'Templates you can preview',
    body: 'Browse the catalogue and look at a layout before you download.',
  },
  {
    title: 'A PDF you can open again',
    body: `A new PDF costs ${GENERATE_PDF_CREDITS} credits. Opening a PDF you already generated does not cost more.`,
  },
  {
    title: 'Optional setup questions',
    body: 'Answer a few questions for suggested profile edits, or skip them. Those questions do not generate a resume for you.',
  },
] as const;

export const CTA_TITLE = 'Download your first resume PDF';
export const CTA_BODY = `A new account receives ${signupCredits} credits. Preview is free, and no card is required.`;

export const CREATE_RESUME_ANSWER =
  'Sign in, type a profile or import a PDF, pick a template, then download a PDF. Optional questions during setup can suggest profile edits.';

export const SUPPORT_ANSWER = 'Email contact@talvio.co.';

export function homepageCopyText(): string {
  return [
    HERO_TITLE,
    HERO_BODY,
    PRIMARY_CTA_LABEL,
    SECONDARY_CTA_LABEL,
    WORKFLOW_TITLE,
    ...WORKFLOW_STEPS.flatMap((step) => [step.title, step.body]),
    BENEFITS_TITLE,
    ...BENEFITS.flatMap((benefit) => [benefit.title, benefit.body]),
    CTA_TITLE,
    CTA_BODY,
    CREATE_RESUME_ANSWER,
    SUPPORT_ANSWER,
  ].join('\n');
}
