import { describe, expect, it } from 'vitest';

import {
  TEMPLATES_PAGE_DESCRIPTION,
  TEMPLATES_PAGE_HEADING,
  TEMPLATES_PAGE_INTRO,
  TEMPLATES_PAGE_TITLE,
  TEMPLATES_RELATED_ATS_HREF,
  TEMPLATES_RELATED_ATS_LABEL,
  TEMPLATES_RELATED_PRICING_HREF,
  TEMPLATES_RELATED_PRICING_LABEL,
} from './templates-page-copy';

const unsupported = /ATS|ATS-safe|parser|application track|pricing|\/ats-friendly-resume|\/pricing/i;

describe('templates page copy', () => {
  it('explains the level filter, preview, and selection', () => {
    const copy = [TEMPLATES_PAGE_TITLE, TEMPLATES_PAGE_DESCRIPTION, TEMPLATES_PAGE_HEADING, TEMPLATES_PAGE_INTRO].join('\n');
    expect(TEMPLATES_PAGE_HEADING).toMatch(/template/i);
    expect(copy).toContain('Entry');
    expect(copy).toContain('Mid');
    expect(copy).toContain('Senior');
    expect(copy).toMatch(/preview/i);
    expect(TEMPLATES_PAGE_INTRO).toMatch(/fill it manually/i);
    expect(TEMPLATES_PAGE_INTRO).toMatch(/existing resume/i);
    expect(TEMPLATES_PAGE_INTRO).toContain('editor');
    expect(copy).not.toMatch(unsupported);
  });

  it('links the catalogue to the explainer and pricing outside the intro', () => {
    expect(TEMPLATES_RELATED_ATS_HREF).toBe('/ats-friendly-resume');
    expect(TEMPLATES_RELATED_ATS_LABEL).toBe('Readable resumes and checkers');
    expect(TEMPLATES_RELATED_PRICING_HREF).toBe('/pricing');
    expect(TEMPLATES_RELATED_PRICING_LABEL).toBe('Pay-as-you-go pricing');
    expect([TEMPLATES_RELATED_ATS_LABEL, TEMPLATES_RELATED_PRICING_LABEL].join('\n')).not.toMatch(/ATS-safe|guaranteed pass|application track/i);
  });
});
