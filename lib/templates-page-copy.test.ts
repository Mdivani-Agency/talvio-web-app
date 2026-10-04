import { describe, expect, it } from 'vitest';

import {
  TEMPLATES_PAGE_DESCRIPTION,
  TEMPLATES_PAGE_HEADING,
  TEMPLATES_PAGE_INTRO,
  TEMPLATES_PAGE_TITLE,
} from './templates-page-copy';

describe('templates page copy', () => {
  it('leads with the target query and the brief intro', () => {
    expect(TEMPLATES_PAGE_HEADING).toBe('Free resume templates');
    expect(TEMPLATES_PAGE_INTRO).toBe('Pick a template for your experience level. Preview is free.');
  });

  it('keeps the intro short enough for the first template to stay above the fold', () => {
    expect(TEMPLATES_PAGE_INTRO.trim().split(/\s+/).length).toBeLessThanOrEqual(30);
  });

  it('mentions no pricing, packs, credits or ATS guarantees, including in the shipped metadata', () => {
    const text = [TEMPLATES_PAGE_HEADING, TEMPLATES_PAGE_INTRO, TEMPLATES_PAGE_TITLE, TEMPLATES_PAGE_DESCRIPTION].join('\n');
    expect(text).not.toMatch(
      /credit|\bpacks?\b|pricing|pay-as-you-go|subscription|ATS-safe|ATS-proof|guarantee/i,
    );
  });
});
