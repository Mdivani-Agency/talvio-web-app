import { differenceInCalendarDays, format } from 'date-fns';

import type { ApplicationPatch } from '@/lib/adapters/application.adapter';
import { DATE_LINE_PREFIX, FOLLOW_UP_AFTER_DAYS, cardDate } from '@/lib/applications-copy';
import { BOARD_COLUMNS, boardColumnOf, isClosedStage } from '@lib/schema/application.schema';
import type { ApplicationLabel, ApplicationStage, BoardColumn, JobApplication } from '@lib/types';

export type BoardColumns = Record<BoardColumn, JobApplication[]>;

/** Board order within a column: sort_order, then the older card first. */
export function compareCards(a: JobApplication, b: JobApplication): number {
  return a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);
}

export function groupByColumn(applications: JobApplication[]): BoardColumns {
  const columns = Object.fromEntries(BOARD_COLUMNS.map((column) => [column, [] as JobApplication[]])) as BoardColumns;
  for (const application of applications) {
    columns[boardColumnOf(application.stage)].push(application);
  }
  for (const column of BOARD_COLUMNS) {
    columns[column].sort(compareCards);
  }
  return columns;
}

export function countActive(applications: JobApplication[]): number {
  return applications.filter((application) => !isClosedStage(application.stage)).length;
}

const labelKey = (name: string) => name.trim().toLowerCase();

/** One chip per label name on any card, sorted by name; the first card's colour wins. */
export function labelFilterOptions(applications: JobApplication[]): ApplicationLabel[] {
  const byKey = new Map<string, ApplicationLabel>();
  for (const application of applications) {
    for (const label of application.labels) {
      if (!byKey.has(labelKey(label.name))) {
        byKey.set(labelKey(label.name), { name: label.name.trim(), color: label.color });
      }
    }
  }
  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

export type CardFilter = { search: string; labels: string[] };

/** A card matches when the search is in its position or company and it carries every picked label. */
export function cardMatches(application: JobApplication, filter: CardFilter): boolean {
  const search = filter.search.trim().toLowerCase();
  if (search && !`${application.position}\n${application.company}`.toLowerCase().includes(search)) {
    return false;
  }
  const carried = new Set(application.labels.map((label) => labelKey(label.name)));
  return filter.labels.every((name) => carried.has(labelKey(name)));
}

/** The sort_order between two neighbours; past either end it steps by 1. */
export function sortOrderBetween(before?: number, after?: number): number {
  if (before === undefined && after === undefined) {
    return 0;
  }
  if (before === undefined) {
    return after! - 1;
  }
  if (after === undefined) {
    return before + 1;
  }
  return (before + after) / 2;
}

/**
 * The sort_order for a card dropped at `index` among the cards shown in a column (the moved card left out). With a
 * filter on, the neighbours are the shown cards, so the card keeps its place relative to what the user sees.
 */
export function sortOrderAt(shownCards: JobApplication[], index: number): number {
  const clamped = Math.max(0, Math.min(index, shownCards.length));
  return sortOrderBetween(shownCards[clamped - 1]?.sortOrder, shownCards[clamped]?.sortOrder);
}

/**
 * Where a dragged card lands in its final column. `ids` is the column as the board shows it during the drag (the card
 * already in it). Dropping on another card takes that card's place; dropping on the column itself (the space below
 * the last card) puts it at the end.
 */
export function dropOrder(ids: string[], activeId: string, overId: string, column: string): string[] {
  const from = ids.indexOf(activeId);
  if (from === -1) {
    return ids;
  }
  const without = ids.filter((id) => id !== activeId);
  if (overId === column) {
    return [...without, activeId];
  }
  const to = ids.indexOf(overId);
  if (to === -1 || to === from) {
    return ids;
  }
  return [...without.slice(0, to), activeId, ...without.slice(to)];
}

/** The sort_order that puts a card at the end of a column. */
export function sortOrderAtEnd(columnCards: JobApplication[]): number {
  return sortOrderBetween(columnCards.at(-1)?.sortOrder, undefined);
}

/** The local calendar day of a timestamp or a `YYYY-MM-DD` date, as a UTC date for formatting. */
export function calendarDay(value: string | Date): Date {
  const day = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : format(new Date(value), 'yyyy-MM-dd');
  return new Date(`${day}T00:00:00.000Z`);
}

/** An Applied card that has not moved for 14 days or more. */
export function needsFollowUp(application: JobApplication, now: Date): boolean {
  return (
    application.stage === 'applied' &&
    differenceInCalendarDays(calendarDay(now), calendarDay(application.stageChangedAt)) >= FOLLOW_UP_AFTER_DAYS
  );
}

/** The card's one date line, such as "Applied 14 Nov" or "Next step 24 Nov". */
export function dateLine(application: JobApplication, now: Date): string {
  const today = calendarDay(now);
  const show = (prefix: string, value: string) => `${prefix} ${cardDate(calendarDay(value), today)}`;
  const column = boardColumnOf(application.stage);
  if (application.nextStepOn && column !== 'closed') {
    return show(DATE_LINE_PREFIX.nextStep, application.nextStepOn);
  }
  if (column === 'applied') {
    return show(DATE_LINE_PREFIX.applied, application.appliedOn ?? application.stageChangedAt);
  }
  return show(DATE_LINE_PREFIX[column], application.stageChangedAt);
}

/** Today as `YYYY-MM-DD` in the user's time zone. */
export function todayIso(now: Date): string {
  return format(now, 'yyyy-MM-dd');
}

/** The patch for moving a card; moving into Applied fills an empty applied-on date with today. */
export function movePatch(application: JobApplication, stage: ApplicationStage, sortOrder: number, now: Date): ApplicationPatch {
  const patch: ApplicationPatch = { sortOrder };
  if (stage !== application.stage) {
    patch.stage = stage;
  }
  if (stage === 'applied' && !application.appliedOn) {
    patch.appliedOn = todayIso(now);
  }
  return patch;
}

/** Picked label names from the URL (`?labels=Remote&labels=Top%20choice`), ignoring blanks and repeats. */
export function labelsFromSearchParams(params: Pick<URLSearchParams, 'getAll'>): string[] {
  const seen = new Set<string>();
  return params
    .getAll('labels')
    .map((name) => name.trim())
    .filter((name) => name && !seen.has(labelKey(name)) && Boolean(seen.add(labelKey(name))));
}

/** The query string with the picked labels, keeping any other parameters. */
export function searchWithLabels(current: string, labels: string[]): string {
  const params = new URLSearchParams(current);
  params.delete('labels');
  for (const name of labels) {
    params.append('labels', name);
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

export function toggleLabel(picked: string[], name: string): string[] {
  return picked.some((item) => labelKey(item) === labelKey(name))
    ? picked.filter((item) => labelKey(item) !== labelKey(name))
    : [...picked, name];
}

export function isLabelPicked(picked: string[], name: string): boolean {
  return picked.some((item) => labelKey(item) === labelKey(name));
}
