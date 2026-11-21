import { describe, expect, it } from 'vitest';

import { FEEDBACK_FORM, FEEDBACK_PROMPT, FEEDBACK_SENT, TRUSTPILOT_REVIEW_URL } from './feedback-copy';

const allText = [FEEDBACK_PROMPT, FEEDBACK_FORM, FEEDBACK_SENT].flatMap((group) => Object.values(group)).join('\n');

describe('feedback prompt copy', () => {
  it('links to the plain Trustpilot review page for talvio.co', () => {
    expect(TRUSTPILOT_REVIEW_URL).toBe('https://www.trustpilot.com/evaluate/talvio.co');
  });

  it('asks every user for an honest review, good or bad', () => {
    expect(FEEDBACK_PROMPT.title).toBe('How did it go? Review Talvio on Trustpilot');
    expect(FEEDBACK_PROMPT.body).toContain('good or bad');
    expect(FEEDBACK_SENT.publicBody).toContain('good or bad');
    expect(FEEDBACK_PROMPT.trustpilot).toBe('Write a review on Trustpilot');
  });

  it('says where a message goes and that Trustpilot opens in a new tab', () => {
    expect(FEEDBACK_FORM.note).toBe(
      'This goes to the Talvio team only. We reply to the email on your account if we need details.',
    );
    expect(FEEDBACK_PROMPT.body).toContain('opens trustpilot.com in a new tab');
  });

  it('never offers a reward or a rating of our own', () => {
    expect(allText).not.toMatch(/\bstars?\b|rating|rate us|reward|discount|free credits?/i);
  });
});
