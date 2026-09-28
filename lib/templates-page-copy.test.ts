import { describe, expect, it } from 'vitest';

import {
  TEMPLATES_PAGE_DESCRIPTION,
  TEMPLATES_PAGE_HEADING,
  TEMPLATES_PAGE_INTRO,
  TEMPLATES_PAGE_TITLE,
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
    expect(TEMPLATES_PAGE_INTRO).toContain('editor');
    expect(copy).not.toMatch(unsupported);
  });
});
