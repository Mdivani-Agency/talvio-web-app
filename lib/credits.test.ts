import { describe, expect, it } from 'vitest';

import {
  CREDIT_PACKS,
  FREE_CREDITS_ANSWER,
  GENERATE_PDF_CREDITS,
  MORE_CREDITS_ANSWER,
  SIGNUP_CREDIT_GRANT,
  SUBSCRIPTION_ANSWER,
  SUBSCRIPTION_QUESTION,
  jobSpecificPdfCount,
} from './credits';

describe('GENERATE_PDF_CREDITS', () => {
  it('mirrors the seeded catalog price', () => {
    expect(GENERATE_PDF_CREDITS).toBe(30);
  });
});

describe('credit packs', () => {
  it('mirrors the signup grant and divides it into new PDFs', () => {
    expect(SIGNUP_CREDIT_GRANT).toBe(300);
    expect(jobSpecificPdfCount(SIGNUP_CREDIT_GRANT)).toBe(10);
  });

  it('uses the homepage pack prices and an exact PDF yield', () => {
    expect(CREDIT_PACKS).toEqual([
      { credits: 300, priceLabel: '$2.99' },
      { credits: 600, priceLabel: '$4.99' },
      { credits: 3000, priceLabel: '$9.99' },
    ]);
    expect(CREDIT_PACKS.map((pack) => jobSpecificPdfCount(pack.credits))).toEqual([10, 20, 100]);
  });

  it('rejects amounts that are not a whole number of PDFs', () => {
    expect(() => jobSpecificPdfCount(10)).toThrow(/multiple of 30/);
  });
});

describe('public billing answers', () => {
  it('states the signup grant, the PDF price, and that a repeat download is free', () => {
    expect(FREE_CREDITS_ANSWER).toContain('300 credits');
    expect(FREE_CREDITS_ANSWER).toContain('30 credits');
    expect(FREE_CREDITS_ANSWER).toContain('10 PDFs');
    expect(FREE_CREDITS_ANSWER).toContain('No credit card is required');
    expect(FREE_CREDITS_ANSWER).toContain('does not use more credits');
  });

  it('lists the shared packs and does not repeat the old 1000 or 10000 sizes', () => {
    expect(MORE_CREDITS_ANSWER).toContain('300 credits ($2.99), 600 credits ($4.99), and 3,000 credits ($9.99)');
    expect(MORE_CREDITS_ANSWER).toContain('30 credits per new job-specific PDF');
    expect(MORE_CREDITS_ANSWER).toContain('10, 20, and 100 PDFs');
    expect(MORE_CREDITS_ANSWER).toContain('do not expire');
    expect(MORE_CREDITS_ANSWER).toContain('do not renew automatically');
    expect(MORE_CREDITS_ANSWER).not.toMatch(/\b1000\b|\b10000\b/);
  });

  it('answers subscriptions and billing issues directly', () => {
    expect(SUBSCRIPTION_QUESTION).toBe('Will I be charged on a subscription?');
    expect(SUBSCRIPTION_ANSWER).toContain('does not sell subscriptions');
    expect(SUBSCRIPTION_ANSWER).toContain('do not renew on their own');
    expect(SUBSCRIPTION_ANSWER).toContain('contact@talvio.co');
    expect(SUBSCRIPTION_ANSWER).not.toMatch(/refund if my subscription/i);
  });
});
