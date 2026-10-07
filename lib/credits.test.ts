import { describe, expect, it } from 'vitest';

import {
  CREDIT_PACKS,
  GENERATE_PDF_CREDITS,
  MONTHLY_CREDIT_ALLOWANCE,
  jobSpecificPdfCount,
} from './credits';

describe('GENERATE_PDF_CREDITS', () => {
  it('mirrors the seeded catalog price', () => {
    expect(GENERATE_PDF_CREDITS).toBe(30);
  });
});

describe('credit packs', () => {
  it('mirrors the monthly allowance, which covers the 3 new resume PDFs the public copy promises', () => {
    expect(MONTHLY_CREDIT_ALLOWANCE).toBe(90);
    // If the PDF price changes, the "3 new resume PDFs every month" claim must be reviewed first (MDI-320).
    expect(jobSpecificPdfCount(MONTHLY_CREDIT_ALLOWANCE)).toBe(3);
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
