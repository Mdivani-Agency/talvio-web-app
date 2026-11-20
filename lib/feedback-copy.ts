/**
 * Copy for the review prompt shown after a new resume PDF (MDI-652, epic MDI-650). Everyone who sees the prompt sees
 * the same Trustpilot button: Trustpilot's rules forbid inviting only happy customers, so nothing here depends on how
 * the user feels.
 */

/** Trustpilot's public "write a review" page for talvio.co. No paid plan: no invitation API, no widget. */
export const TRUSTPILOT_REVIEW_URL = 'https://www.trustpilot.com/evaluate/talvio.co';

export const FEEDBACK_PROMPT = {
  downloading: 'Your PDF is downloading',
  title: 'How did it go? Review Talvio on Trustpilot',
  body: 'An honest review helps other job seekers decide. Say it as it was, good or bad. It takes a minute and opens trustpilot.com in a new tab.',
  trustpilot: 'Write a review on Trustpilot',
  /** Read by screen readers after the button name. */
  newTab: '(opens in a new tab)',
  wrong: 'Tell us what went wrong',
  notNow: 'Not now',
  close: 'Close',
} as const;

export const FEEDBACK_FORM = {
  label: 'Tell us what went wrong',
  placeholder: 'What happened, and what you expected',
  note: 'This goes to the Talvio team only. We reply to the email on your account if we need details.',
  cancel: 'Cancel',
  send: 'Send to Talvio',
  failed: 'Your message was not sent. Try again.',
} as const;

export const FEEDBACK_SENT = {
  title: 'Thanks for telling us',
  body: 'Your message is with the team. We will look into it.',
  publicTitle: 'You can still review us publicly',
  publicBody: 'Say it as it was, good or bad. It opens trustpilot.com in a new tab.',
  done: 'Done',
} as const;
