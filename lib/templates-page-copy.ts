/** Sitemap date (ISO). Change it with the copy in this file. */
export const TEMPLATES_LAST_MODIFIED = '2026-11-19';

export const TEMPLATES_PAGE_TITLE = 'Free resume templates by experience level | Talvio';

export const TEMPLATES_PAGE_DESCRIPTION =
  'Free resume templates for entry, mid and senior roles. Pick one for your experience level, preview it for free, and download a clean resume PDF.';

/** Primary query: "free resume templates". */
export const TEMPLATES_PAGE_HEADING = 'Free resume templates';

// As written in the messaging brief.
export const TEMPLATES_PAGE_INTRO = 'Pick a template for your experience level. Preview is free.';

export type TemplatesPageLevel = 'entry' | 'mid' | 'senior';

/** Names the level switch for assistive technology. */
export const TEMPLATES_LEVEL_GROUP_LABEL = 'Experience level';

/** The level switch, in display order. Senior is the default. */
export const TEMPLATES_LEVELS: ReadonlyArray<{ id: TemplatesPageLevel; label: string }> = [
  { id: 'entry', label: 'Entry level' },
  { id: 'mid', label: 'Mid level' },
  { id: 'senior', label: 'Senior level' },
];

export const TEMPLATES_DEFAULT_LEVEL: TemplatesPageLevel = 'senior';

/** The template card's call to action: on hover or focus from md, always beside the name on phone. */
export const TEMPLATES_USE_LABEL = 'Use template';

/** Accessible name of a template card, e.g. "Use the Modern template, senior level". */
export function templateCardLabel(name: string, levelLabel: string): string {
  return `Use the ${name} template, ${levelLabel.toLowerCase()}`;
}

/** The phone carousel: its label, its slides and its controls. */
export function templatesCarouselLabel(levelLabel: string): string {
  return `${levelLabel} templates`;
}
export function templatesSlideLabel(position: number, total: number): string {
  return `${position} of ${total}`;
}
export function templatesDotLabel(name: string): string {
  return `Show ${name}`;
}
export const TEMPLATES_PREVIOUS_LABEL = 'Previous template';
export const TEMPLATES_NEXT_LABEL = 'Next template';
