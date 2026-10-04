import { describe, expect, it } from 'vitest';

import {
  CREDIT_PACKS,
  GENERATE_PDF_CREDITS,
  SIGNUP_CREDIT_GRANT,
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
