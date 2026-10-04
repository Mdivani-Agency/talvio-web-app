import { describe, expect, it } from 'vitest';

import {
  ATS_CLOSING_BODY,
  ATS_PAGE_HEADING,
  ATS_PAGE_INTRO,
  ATS_PATH,
  ATS_PRIMARY_CTA_HREF,
  ATS_PRIMARY_CTA_LABEL,
  ATS_SECONDARY_CTA_HREF,
  ATS_SECTIONS,
  atsMetadataText,
  atsPageText,
} from './ats-page-copy';

const words = (text: string) => text.trim().split(/\s+/).length;

/** Banned by the messaging brief (MDI-322). */
const banned =
  /credit|\bpacks?\b|pricing|\bprices?\b|subscription|\bplans?\b|upgrade|premium|pay as you go|pay-as-you-go|free trial|unlimited|\bCV\b|sign up|log in|ATS-proof|ATS-optimized|beats the ATS|guarantee|pass(es)? the ATS|ATS pass|dream job|in minutes|in seconds|!/i;

describe('ATS guide copy', () => {
  it('leads with the target query', () => {
    expect(ATS_PATH).toBe('/ats-friendly-resume');
    expect(ATS_PAGE_HEADING).toBe('How to make an ATS-friendly resume');
  });

  it('covers headings, reading order, evidence, checker limits and a PDF check, once each', () => {
    expect(ATS_SECTIONS.map((section) => section.heading)).toEqual([
      'Use standard headings',
      'Keep one reading order',
      'Show what you did',
      'Treat checker scores lightly',
      'Test your PDF',
    ]);
    const mentions = (pattern: RegExp) => ATS_SECTIONS.filter((section) => pattern.test(section.body)).length;
    expect(mentions(/checker/i)).toBe(1);
    expect(mentions(/employer/i)).toBe(1);
    expect(ATS_PAGE_INTRO).not.toMatch(/checker/i);
  });

  it('keeps every block inside its word budget', () => {
    expect(words(ATS_PAGE_HEADING)).toBeLessThanOrEqual(10);
    expect(words(ATS_PAGE_INTRO)).toBeLessThanOrEqual(30);
    for (const section of ATS_SECTIONS) {
      expect(words(section.heading), section.heading).toBeLessThanOrEqual(5);
      expect(words(section.body), section.heading).toBeLessThanOrEqual(18);
    }
    expect(words(ATS_CLOSING_BODY)).toBeLessThanOrEqual(30);
    for (const sentence of atsPageText().split(/(?<=[.?])\s+|\n/)) {
      expect(words(sentence), sentence).toBeLessThanOrEqual(18);
    }
  });

  it('ends with one primary button and no pricing or outbound links', () => {
    expect(ATS_PRIMARY_CTA_LABEL).toBe('Start free');
    expect(ATS_PRIMARY_CTA_HREF).toBe('/auth/sign-in');
    expect(ATS_SECONDARY_CTA_HREF).toBe('/templates');
    expect(atsPageText()).not.toMatch(/mdivani\.agency|\/blog|\/pricing/);
  });

  it('uses no banned terms and promises no ATS outcome', () => {
    expect(atsPageText()).not.toMatch(banned);
    expect(atsMetadataText()).not.toMatch(banned);
    expect(atsPageText()).not.toMatch(/interview|get (you )?(a|the) job|hired/i);
  });
});
