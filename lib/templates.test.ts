import { existsSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { TemplateKeyEnum } from '@lib/schema/enums';

import {
  findTemplate,
  colorAfterTemplateChange,
  galleryTemplateFor,
  NEW_TAG_DAYS,
  NEW_TEMPLATES_LAUNCHED,
  showsNewTag,
  TEMPLATE_GALLERY,
  TEMPLATE_LIST,
  templateFilterCounts,
} from './templates';

const legacy = Object.values(TEMPLATE_LIST).flat();
const all = [...legacy, ...TEMPLATE_GALLERY];

describe('template catalogue', () => {
  it('shows 14 templates in the gallery: Classic, the four older styles, then the other nine', () => {
    expect(TEMPLATE_GALLERY.map((template) => template.key)).toEqual([
      'classic',
      'senior-level-modern',
      'senior-level-ember',
      'senior-level-mint',
      'senior-level-talvio',
      'compact',
      'minimal',
      'executive',
      'skills-first',
      'graduate',
      'technical',
      'sidebar',
      'timeline',
      'banner',
    ]);
    expect(TEMPLATE_GALLERY.filter((template) => template.isNew)).toHaveLength(10);
  });

  it('resolves every key, including the 12 older level keys, to its style', () => {
    for (const key of TemplateKeyEnum.options) {
      expect(findTemplate(key)?.key).toBe(key);
    }
    expect(legacy).toHaveLength(12);
    expect(galleryTemplateFor('entry-level-mint')?.key).toBe('senior-level-mint');
    expect(galleryTemplateFor('mid-level-modern')?.name).toBe('Modern');
    expect(galleryTemplateFor('technical')?.key).toBe('technical');
  });

  it('counts the templates under each filter', () => {
    expect(templateFilterCounts()).toEqual({
      all: 14,
      'first-job': 4,
      experienced: 9,
      senior: 4,
      technical: 1,
      creative: 3,
      'career-change': 1,
    });
  });

  it(`tags the new templates for ${NEW_TAG_DAYS} days after launch, then stops`, () => {
    const launch = new Date(`${NEW_TEMPLATES_LAUNCHED}T00:00:00.000Z`);
    const day = 24 * 60 * 60 * 1000;
    const technical = findTemplate('technical')!;
    expect(showsNewTag(technical, launch)).toBe(true);
    expect(showsNewTag(technical, new Date(launch.getTime() + (NEW_TAG_DAYS - 1) * day))).toBe(true);
    expect(showsNewTag(technical, new Date(launch.getTime() + NEW_TAG_DAYS * day))).toBe(false);
    expect(showsNewTag(findTemplate('senior-level-mint')!, launch)).toBe(false);
  });
});

describe('colorAfterTemplateChange', () => {
  const colorOf = (key: Parameters<typeof colorAfterTemplateChange>[1]) => galleryTemplateFor(key)!.color;

  it('follows the new template while the resume is on its template\'s own colour', () => {
    const modern = { template: 'senior-level-modern' as const, color: colorOf('senior-level-modern') };
    expect(colorAfterTemplateChange(modern, 'timeline')).toBe(colorOf('timeline'));
    expect(colorAfterTemplateChange({ ...modern, color: modern.color.toLowerCase() }, 'executive')).toBe(colorOf('executive'));
  });

  it('keeps a colour the user picked', () => {
    const picked = { template: 'senior-level-modern' as const, color: '#BA8E23' };
    expect(colorAfterTemplateChange(picked, 'timeline')).toBe('#BA8E23');
  });

  it('gives every gallery template a colour other than one shared default', () => {
    expect(new Set(TEMPLATE_GALLERY.map((template) => template.color)).size).toBeGreaterThan(1);
  });
});

describe('template catalogue previews', () => {
  it('points every template at a PNG preview named after its key', () => {
    for (const { key, imageUrl } of all) {
      expect(imageUrl).toBe(`/templates/${key}.png`);
    }
  });

  it('ships a preview file in public/ for every template', () => {
    const missing = all.filter(({ imageUrl }) => !existsSync(path.join(process.cwd(), 'public', imageUrl)));
    expect(missing.map(({ key }) => key)).toEqual([]);
  });
});
