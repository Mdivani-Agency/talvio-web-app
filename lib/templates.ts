import { ember, mint, talvio } from '@pdf-tlv/resume/dist/templates';
import type { Template } from '@pdf-tlv/resume';

import {
  banner,
  classic,
  compact,
  executive,
  graduate,
  minimal,
  sidebar,
  skillsFirst,
  technical,
  timeline,
} from '@lib/pdf-templates';
import type { TemplateItem, TemplateKey, TemplateList } from '@lib/types';
import { RESUME_COLORS_MAP } from '@lib/utils/tailwind';
import { TEMPLATE_COPY, type TemplateFilter, type TemplateStyle } from '@/lib/templates-page-copy';

/**
 * The template catalogue. The gallery shows one card per style (14), in `GALLERY_ORDER`. The four styles that predate
 * MDI-660 still have a key per experience level (`entry-level-mint` and so on): the level never changed the layout,
 * every one of those 12 keys keeps working for saved resumes and old links, and the gallery card for a style uses its
 * senior key.
 */

/** When the ten new templates went live; they carry a "New" tag for `NEW_TAG_DAYS` after it. */
export const NEW_TEMPLATES_LAUNCHED = '2026-11-20';
export const NEW_TAG_DAYS = 60;

export type TemplateLevel = 'entry' | 'mid' | 'senior';

const LEGACY_STYLES = [
  // Modern reuses the Ember layout; only the default colour differs.
  { style: 'modern', template: ember, color: RESUME_COLORS_MAP.grayLight },
  { style: 'ember', template: ember, color: RESUME_COLORS_MAP.ember },
  { style: 'mint', template: mint, color: RESUME_COLORS_MAP.mint },
  { style: 'talvio', template: talvio, color: RESUME_COLORS_MAP.talvio },
] as const;

/** The ten templates of MDI-660, with the accent of their design board. */
const NEW_STYLES: ReadonlyArray<{ style: TemplateStyle; key: TemplateKey; template: Template; color: string }> = [
  { style: 'classic', key: 'classic', template: classic, color: RESUME_COLORS_MAP.black },
  { style: 'compact', key: 'compact', template: compact, color: RESUME_COLORS_MAP.talvio },
  { style: 'minimal', key: 'minimal', template: minimal, color: RESUME_COLORS_MAP.brown },
  { style: 'executive', key: 'executive', template: executive, color: RESUME_COLORS_MAP.ember },
  { style: 'skills-first', key: 'skills-first', template: skillsFirst, color: RESUME_COLORS_MAP.mint },
  { style: 'graduate', key: 'graduate', template: graduate, color: RESUME_COLORS_MAP.talvio },
  { style: 'technical', key: 'technical', template: technical, color: RESUME_COLORS_MAP.mint },
  { style: 'sidebar', key: 'sidebar', template: sidebar, color: RESUME_COLORS_MAP.talvio },
  { style: 'timeline', key: 'timeline', template: timeline, color: RESUME_COLORS_MAP.red },
  { style: 'banner', key: 'banner', template: banner, color: RESUME_COLORS_MAP.talvio },
];

function item(key: TemplateKey, style: TemplateStyle, template: Template, color: string, isNew: boolean): TemplateItem {
  const copy = TEMPLATE_COPY[style];
  return {
    key,
    style,
    name: copy.name,
    description: copy.description,
    bestFor: copy.bestFor,
    filters: copy.filters,
    template,
    color,
    isNew,
    imageUrl: `/templates/${key}.png`,
  };
}

const legacyItem = (level: TemplateLevel, entry: (typeof LEGACY_STYLES)[number]) =>
  item(`${level}-level-${entry.style}` as TemplateKey, entry.style, entry.template as Template, entry.color, false);

/** The 12 keys of the four older styles, by level. Kept so every saved key resolves. */
export const TEMPLATE_LIST: TemplateList = {
  entry: LEGACY_STYLES.map((entry) => legacyItem('entry', entry)),
  mid: LEGACY_STYLES.map((entry) => legacyItem('mid', entry)),
  senior: LEGACY_STYLES.map((entry) => legacyItem('senior', entry)),
};

const NEW_TEMPLATES = NEW_STYLES.map(({ key, style, template, color }) => item(key, style, template, color, true));

/** Gallery order: Classic first (the safest pick), then the four older styles, then the other nine. */
export const GALLERY_ORDER: readonly TemplateStyle[] = [
  'classic',
  'modern',
  'ember',
  'mint',
  'talvio',
  'compact',
  'minimal',
  'executive',
  'skills-first',
  'graduate',
  'technical',
  'sidebar',
  'timeline',
  'banner',
];

const ALL_TEMPLATES: TemplateItem[] = [...NEW_TEMPLATES, ...TEMPLATE_LIST.entry, ...TEMPLATE_LIST.mid, ...TEMPLATE_LIST.senior];

/** The 14 templates of the gallery, in order. An older style appears once, with its senior key. */
export const TEMPLATE_GALLERY: readonly TemplateItem[] = GALLERY_ORDER.map(
  (style) =>
    NEW_TEMPLATES.find((entry) => entry.style === style)
    ?? TEMPLATE_LIST.senior.find((entry) => entry.style === style)!,
);

export function listResumeTemplates(): readonly TemplateItem[] {
  return TEMPLATE_GALLERY;
}

export function findTemplate(key?: TemplateKey | null) {
  if (!key) {
    return undefined;
  }
  return ALL_TEMPLATES.find((template) => template.key === key);
}

/**
 * The accent colour after a template change. A resume still on its template's own colour follows the new template to
 * that template's colour, as its gallery image shows; a colour the user picked is kept.
 */
export function colorAfterTemplateChange(current: { template: TemplateKey; color: string }, next: TemplateKey): string {
  const previous = findTemplate(current.template)?.color;
  const nextColor = findTemplate(next)?.color;
  if (!nextColor || !previous) {
    return current.color;
  }
  return previous.toLowerCase() === current.color.toLowerCase() ? nextColor : current.color;
}

/** The gallery card a key belongs to: `mid-level-mint` shows as Mint. */
export function galleryTemplateFor(key?: TemplateKey | null): TemplateItem | undefined {
  const style = findTemplate(key)?.style;
  return style ? TEMPLATE_GALLERY.find((template) => template.style === style) : undefined;
}

/** True while a new template's "New" tag shows: from launch for `NEW_TAG_DAYS` days. */
export function showsNewTag(template: Pick<TemplateItem, 'isNew'>, now: Date = new Date()): boolean {
  if (!template.isNew) return false;
  const end = new Date(`${NEW_TEMPLATES_LAUNCHED}T00:00:00.000Z`);
  end.setUTCDate(end.getUTCDate() + NEW_TAG_DAYS);
  return now.getTime() < end.getTime();
}

/** How many gallery templates each filter shows, for the chip counts. */
export function templateFilterCounts(templates: readonly TemplateItem[] = TEMPLATE_GALLERY) {
  const counts = { all: templates.length } as Record<TemplateFilter | 'all', number>;
  for (const template of templates) {
    for (const filter of template.filters) counts[filter] = (counts[filter] ?? 0) + 1;
  }
  return counts;
}

export function filterTemplates(templates: readonly TemplateItem[], filter: TemplateFilter | 'all') {
  return filter === 'all' ? templates : templates.filter((template) => template.filters.includes(filter));
}
