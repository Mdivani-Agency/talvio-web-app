import { describe, expect, it } from 'vitest';

import { BRIEF_BANNED_TERMS } from '@/test/utils/public-copy';

import {
  TEMPLATE_COPY,
  TEMPLATE_FILTERS,
  TEMPLATES_LAST_MODIFIED,
  TEMPLATES_PAGE_DESCRIPTION,
  TEMPLATES_PAGE_HEADING,
  TEMPLATES_PAGE_INTRO,
  TEMPLATES_PAGE_TITLE,
  TEMPLATES_USE_LABEL,
  templateBestFor,
  templateCardLabel,
  templateFilterLabel,
  templatesShowingLabel,
  templatesSlideLabel,
} from './templates-page-copy';

describe('templates page copy', () => {
  it('leads with the target query and an intro that names the count and the filters', () => {
    expect(TEMPLATES_PAGE_HEADING).toBe('Free resume templates');
    expect(TEMPLATES_PAGE_INTRO).toBe('14 templates, from classic to bold. Filter by where you are in your career. Preview is free.');
    expect(TEMPLATES_PAGE_TITLE).toBe('Free resume templates: 14 layouts to choose from | Talvio');
  });

  it('states the true template count and no experience levels', () => {
    expect(Object.keys(TEMPLATE_COPY)).toHaveLength(14);
    const text = [TEMPLATES_PAGE_INTRO, TEMPLATES_PAGE_TITLE, TEMPLATES_PAGE_DESCRIPTION].join('\n');
    expect(text).not.toMatch(/experience level|entry, mid|12 templates/i);
    expect(TEMPLATES_PAGE_DESCRIPTION).toMatch(/^Fourteen /);
  });

  it('keeps the intro short enough for the first template to stay above the fold', () => {
    expect(TEMPLATES_PAGE_INTRO.trim().split(/\s+/).length).toBeLessThanOrEqual(30);
  });

  it('mentions no pricing, packs, credits or ATS guarantees, including in the shipped metadata and the cards', () => {
    const cards = Object.values(TEMPLATE_COPY).flatMap((copy) => [copy.name, copy.description, copy.bestFor]);
    const text = [TEMPLATES_PAGE_HEADING, TEMPLATES_PAGE_INTRO, TEMPLATES_PAGE_TITLE, TEMPLATES_PAGE_DESCRIPTION, ...cards].join('\n');
    expect(text).not.toMatch(BRIEF_BANNED_TERMS);
    expect(text).not.toMatch(/ATS-safe/i);
  });

  it('labels the filters in sentence case, every one used by at least one template', () => {
    expect(TEMPLATE_FILTERS.map((filter) => filter.label)).toEqual([
      'All',
      'First job',
      'Experienced',
      'Senior',
      'Technical',
      'Creative',
      'Career change',
    ]);
    for (const { id } of TEMPLATE_FILTERS.slice(1)) {
      expect(Object.values(TEMPLATE_COPY).some((copy) => (copy.filters as readonly string[]).includes(id))).toBe(true);
    }
  });

  it('dates the copy', () => {
    expect(TEMPLATES_LAST_MODIFIED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('names the cards, the chips, the count line and the carousel parts', () => {
    expect(TEMPLATES_USE_LABEL).toBe('Use template');
    expect(templateCardLabel('Modern')).toBe('Use the Modern template');
    expect(templateBestFor('engineering, data and IT')).toBe('Best for: engineering, data and IT');
    expect(templateFilterLabel('First job', 4)).toBe('First job (4)');
    expect(templatesShowingLabel(14, 14)).toBe('Showing all 14 templates');
    expect(templatesShowingLabel(4, 14)).toBe('Showing 4 of 14 templates');
    expect(templatesSlideLabel(1, 14)).toBe('1 of 14');
  });
});
