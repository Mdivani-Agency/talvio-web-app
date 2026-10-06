import { describe, expect, it } from 'vitest';

import { allowanceStatus, MONTHLY_PDF_ALLOWANCE, nextAllowanceRenewal } from './allowance';

describe('monthly allowance', () => {
  it('pays for 3 new resume PDFs a month', () => {
    expect(MONTHLY_PDF_ALLOWANCE).toBe(3);
  });

  it('renews on the 1st of the next UTC month at 00:00', () => {
    expect(nextAllowanceRenewal(new Date('2026-10-06T11:00:00Z')).toISOString()).toBe('2026-11-01T00:00:00.000Z');
    expect(nextAllowanceRenewal(new Date('2026-10-01T00:00:00Z')).toISOString()).toBe('2026-11-01T00:00:00.000Z');
    expect(nextAllowanceRenewal(new Date('2026-10-31T23:59:59Z')).toISOString()).toBe('2026-11-01T00:00:00.000Z');
  });

  it('rolls over the year in December', () => {
    expect(nextAllowanceRenewal(new Date('2026-12-15T12:00:00Z')).toISOString()).toBe('2027-01-01T00:00:00.000Z');
  });

  it('uses UTC, not the local day, near midnight', () => {
    // 23:30 on 31 October in UTC-5 is already 1 November in UTC, so the next reset is 1 December.
    expect(nextAllowanceRenewal(new Date('2026-11-01T04:30:00Z')).toISOString()).toBe('2026-12-01T00:00:00.000Z');
  });

  it.each([
    [90, 3, false],
    [60, 2, false],
    [30, 1, false],
    [29, 0, true],
    [0, 0, true],
  ])('counts a balance of %i as %i PDFs left', (balance, remaining, exhausted) => {
    const status = allowanceStatus(balance, new Date('2026-10-06T00:00:00Z'));
    expect(status).toEqual({
      remaining,
      total: 3,
      renewsOn: new Date('2026-11-01T00:00:00Z'),
      exhausted,
    });
  });

  it('never shows more left than the total for a legacy balance', () => {
    expect(allowanceStatus(300)).toMatchObject({ remaining: 10, total: 10, exhausted: false });
  });

  it('treats a negative balance as none left', () => {
    expect(allowanceStatus(-30)).toMatchObject({ remaining: 0, exhausted: true });
  });
});
