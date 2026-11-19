import { describe, expect, it } from 'vitest';

import { BRIEF_BANNED_TERMS } from '@/test/utils/public-copy';

import {
  TEMPLATES_DEFAULT_LEVEL,
  TEMPLATES_LAST_MODIFIED,
  TEMPLATES_LEVEL_GROUP_LABEL,
  TEMPLATES_LEVELS,
  TEMPLATES_PAGE_DESCRIPTION,
  TEMPLATES_PAGE_HEADING,
  TEMPLATES_PAGE_INTRO,
  TEMPLATES_PAGE_TITLE,
  TEMPLATES_USE_LABEL,
  templateCardLabel,
  templatesCarouselLabel,
  templatesDotLabel,
  templatesSlideLabel,
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
    expect(text).not.toMatch(BRIEF_BANNED_TERMS);
    expect(text).not.toMatch(/ATS-safe/i);
  });

  it('labels the three levels in sentence case, with senior as the default', () => {
    expect(TEMPLATES_LEVELS.map((level) => level.id)).toEqual(['entry', 'mid', 'senior']);
    expect(TEMPLATES_LEVELS.map((level) => level.label)).toEqual(['Entry level', 'Mid level', 'Senior level']);
    expect(TEMPLATES_DEFAULT_LEVEL).toBe('senior');
    expect(TEMPLATES_LEVEL_GROUP_LABEL).toBe('Experience level');
  });

  it('dates the copy', () => {
    expect(TEMPLATES_LAST_MODIFIED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('names the cards and the carousel parts', () => {
    expect(TEMPLATES_USE_LABEL).toBe('Use template');
    expect(templateCardLabel('Modern', 'Senior level')).toBe('Use the Modern template, senior level');
    expect(templatesCarouselLabel('Entry level')).toBe('Entry level templates');
    expect(templatesSlideLabel(1, 4)).toBe('1 of 4');
    expect(templatesDotLabel('Mint')).toBe('Show Mint');
  });
});
