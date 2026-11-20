import type { Template } from '@pdf-tlv/resume';

/**
 * Sections the user can reorder, by their `section` name in the template configs. The header (name, role, contact)
 * and the summary always come first. Skills carries tools and languages with it.
 */
export const MOVABLE_SECTIONS = ['experience', 'education', 'skills', 'projects', 'recommendations'] as const;
export type MovableSection = (typeof MOVABLE_SECTIONS)[number];

/** Sections that stay first in every template; sent ahead of the user's order so they never move. */
const FIXED_SECTIONS = ['summary'] as const;

function isMovable(name: string): name is MovableSection {
  return (MOVABLE_SECTIONS as readonly string[]).includes(name);
}

/** A list of known, unique section names, in the given order, then any missing ones in `fallback` order. */
function complete(order: readonly string[], fallback: readonly MovableSection[]): MovableSection[] {
  const seen = new Set<MovableSection>();
  for (const name of order) {
    if (isMovable(name)) seen.add(name);
  }
  for (const name of fallback) seen.add(name);
  return [...seen];
}

/**
 * The template's own order of the movable sections. Recommendations come last when a template does not place them.
 */
export function templateSectionOrder(template: Pick<Template, 'defaultSectionOrder'>): MovableSection[] {
  return complete(template.defaultSectionOrder ?? [], MOVABLE_SECTIONS);
}

/** The order the resume uses: the user's own order when it has one, else the template's. */
export function effectiveSectionOrder(
  order: readonly string[] | undefined,
  template: Pick<Template, 'defaultSectionOrder'>,
): MovableSection[] {
  const defaults = templateSectionOrder(template);
  return order?.length ? complete(order, defaults) : defaults;
}

export function sameOrder(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((name, index) => name === b[index]);
}

/**
 * What to store after a move: `undefined` when the order is the template's own, so a resume without a custom order
 * keeps following whichever template it uses.
 */
export function storedSectionOrder(
  order: readonly MovableSection[],
  template: Pick<Template, 'defaultSectionOrder'>,
): MovableSection[] | undefined {
  return sameOrder(order, templateSectionOrder(template)) ? undefined : [...order];
}

/** Move one section up (-1) or down (+1). Returns the same list when it cannot move. */
export function moveSection(order: readonly MovableSection[], index: number, step: -1 | 1): MovableSection[] {
  const target = index + step;
  if (index < 0 || index >= order.length || target < 0 || target >= order.length) return [...order];
  const next = [...order];
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}

/**
 * The `sectionOrder` for `@pdf-tlv/resume`: undefined without a custom order, so the template's default applies and the
 * PDF is unchanged. With one, the fixed sections lead so they never move.
 */
export function pdfSectionOrder(order: readonly string[] | undefined): string[] | undefined {
  if (!order?.length) return undefined;
  return [...FIXED_SECTIONS, ...order.filter(isMovable)];
}
