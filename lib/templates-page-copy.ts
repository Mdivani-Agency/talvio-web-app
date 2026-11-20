/** Sitemap date (ISO). Change it with the copy in this file. */
export const TEMPLATES_LAST_MODIFIED = '2026-11-20';

export const TEMPLATES_PAGE_TITLE = 'Free resume templates: 14 layouts to choose from | Talvio';

export const TEMPLATES_PAGE_DESCRIPTION =
  'Fourteen free resume templates, from classic to bold. Find the one that fits your career, preview it for free, and download a clean resume PDF.';

/** Primary query: "free resume templates". */
export const TEMPLATES_PAGE_HEADING = 'Free resume templates';

export const TEMPLATES_PAGE_INTRO = '14 templates, from classic to bold. Filter by where you are in your career. Preview is free.';

/** Who a template suits. A template can sit under several. */
export type TemplateFilter = 'first-job' | 'experienced' | 'senior' | 'technical' | 'creative' | 'career-change';

/** The filter chips, in display order. `all` shows every template. */
export const TEMPLATE_FILTERS: ReadonlyArray<{ id: TemplateFilter | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'first-job', label: 'First job' },
  { id: 'experienced', label: 'Experienced' },
  { id: 'senior', label: 'Senior' },
  { id: 'technical', label: 'Technical' },
  { id: 'creative', label: 'Creative' },
  { id: 'career-change', label: 'Career change' },
];

/** Names the chips for assistive technology. */
export const TEMPLATE_FILTER_GROUP_LABEL = 'Filter templates';

/** A chip: "First job (4)". */
export const templateFilterLabel = (label: string, count: number) => `${label} (${count})`;

/** The line under the chips, announced to screen readers: "Showing 4 of 14 templates". */
export const templatesShowingLabel = (shown: number, total: number) =>
  shown === total ? `Showing all ${total} templates` : `Showing ${shown} of ${total} templates`;

/** Gallery style ids, in gallery order: Classic first, then the four existing styles, then the other nine. */
export type TemplateStyle =
  | 'classic'
  | 'modern'
  | 'ember'
  | 'mint'
  | 'talvio'
  | 'compact'
  | 'minimal'
  | 'executive'
  | 'skills-first'
  | 'graduate'
  | 'technical'
  | 'sidebar'
  | 'timeline'
  | 'banner';

export type TemplateCopy = {
  name: string;
  /** One line, no full stop. */
  description: string;
  /** Completes "Best for …". */
  bestFor: string;
  filters: readonly TemplateFilter[];
};

/** Copy for each template card (approved on the MDI-666 ticket, 20 Nov). */
export const TEMPLATE_COPY: Readonly<Record<TemplateStyle, TemplateCopy>> = {
  classic: {
    name: 'Classic',
    description: 'Serif type, a centred name and ruled headings: the format recruiters expect',
    bestFor: 'finance, law, consulting and academia',
    filters: ['first-job', 'experienced', 'senior'],
  },
  modern: {
    name: 'Modern',
    description: 'Section labels down the left, in quiet grey',
    bestFor: 'formal roles and conservative employers',
    filters: ['experienced', 'senior'],
  },
  ember: {
    name: 'Ember',
    description: 'The Modern layout with a warm red accent',
    bestFor: 'a touch of colour on a structured page',
    filters: ['experienced', 'creative'],
  },
  mint: {
    name: 'Mint',
    description: 'Centred header, with skills summed up before experience',
    bestFor: 'early and mid-career roles',
    filters: ['first-job', 'experienced'],
  },
  talvio: {
    name: 'Talvio',
    description: 'Experience on the left; contact, skills and education on the right',
    bestFor: 'roles with a long skills list',
    filters: ['experienced'],
  },
  compact: {
    name: 'Compact',
    description: 'Tight spacing that fits a long career on one page',
    bestFor: 'ten or more years of experience',
    filters: ['experienced', 'senior'],
  },
  minimal: {
    name: 'Minimal',
    description: 'Plenty of white space, with section labels in the margin',
    bestFor: 'design, product and marketing',
    filters: ['creative', 'experienced'],
  },
  executive: {
    name: 'Executive',
    description: 'Opens with a summary and three headline results',
    bestFor: 'directors and senior leads',
    filters: ['senior'],
  },
  'skills-first': {
    name: 'Skills first',
    description: 'Puts grouped skills above your work history',
    bestFor: 'changing career or returning to work',
    filters: ['career-change'],
  },
  graduate: {
    name: 'Graduate',
    description: 'Leads with education and projects',
    bestFor: 'students, graduates and first jobs',
    filters: ['first-job'],
  },
  technical: {
    name: 'Technical',
    description: 'A skills table, the stack under each role, and project links',
    bestFor: 'engineering, data and IT',
    filters: ['technical'],
  },
  sidebar: {
    name: 'Sidebar',
    description: 'A coloured side column for contact details and skills',
    bestFor: 'early and mid-career roles',
    filters: ['first-job', 'experienced'],
  },
  timeline: {
    name: 'Timeline',
    description: 'Dates run down a line, so your progress is easy to follow',
    bestFor: 'steady careers with clear promotions',
    filters: ['experienced'],
  },
  banner: {
    name: 'Banner',
    description: 'A bold colour band across the top with your name',
    bestFor: 'sales, marketing and creative roles',
    filters: ['creative'],
  },
};

/** The card's "Best for" line. */
export const templateBestFor = (bestFor: string) => `Best for: ${bestFor}`;

/** The tag on the ten new templates, for 60 days after launch. */
export const TEMPLATE_NEW_TAG = 'New';

/** The template card's call to action: on hover or focus from md, always below the text on phone. */
export const TEMPLATES_USE_LABEL = 'Use template';

/** Accessible name of a template card, e.g. "Use the Modern template". */
export function templateCardLabel(name: string): string {
  return `Use the ${name} template`;
}

/** The phone carousel: its label, its slides and its controls. */
export const TEMPLATES_CAROUSEL_LABEL = 'Templates';
export function templatesSlideLabel(position: number, total: number): string {
  return `${position} of ${total}`;
}
export const TEMPLATES_PREVIOUS_LABEL = 'Previous template';
export const TEMPLATES_NEXT_LABEL = 'Next template';
