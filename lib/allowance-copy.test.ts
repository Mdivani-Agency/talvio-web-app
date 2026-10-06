import { describe, expect, it } from 'vitest';

import { BRIEF_BANNED_TERMS } from '@/test/utils/public-copy';

import {
  allowanceCopyText,
  allowanceExhaustedLine,
  allowanceRemainingLine,
  allowanceRenewsLine,
  formatRenewalDate,
  generateBlockedNote,
  generateDialogLine,
} from './allowance-copy';

describe('allowance copy', () => {
  it('counts resume PDFs left this month', () => {
    expect(allowanceRemainingLine(3, 3)).toBe('3 of 3 left this month');
    expect(allowanceRemainingLine(0, 3)).toBe('0 of 3 left this month');
  });

  it('writes the renewal date as day and month in UTC', () => {
    expect(formatRenewalDate(new Date('2026-11-01T00:00:00Z'))).toBe('1 November');
    expect(allowanceRenewsLine(new Date('2027-01-01T00:00:00Z'))).toBe('Renews on 1 January');
    expect(generateBlockedNote(new Date('2026-11-01T00:00:00Z'))).toBe('Next PDF on 1 November');
  });

  it('names the renewal date when nothing is left', () => {
    expect(allowanceExhaustedLine(3, new Date('2026-11-01T00:00:00Z'))).toBe(
      'No new resume PDFs left this month. You get 3 more on 1 November.',
    );
  });

  it('adds the count to the generate dialog only when it is known', () => {
    expect(generateDialogLine(2, 3)).toContain('You have 2 of 3 left this month.');
    expect(generateDialogLine()).not.toContain('left this month');
  });

  it('mentions no credits, packs, buying or subscriptions', () => {
    const text = allowanceCopyText();
    expect(text).not.toMatch(BRIEF_BANNED_TERMS);
    expect(text).not.toMatch(/\bbuy|purchase|top.?up|\bpay\b|\$\d/i);
  });
});
