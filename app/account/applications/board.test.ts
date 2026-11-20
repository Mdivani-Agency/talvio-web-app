import { describe, expect, it } from 'vitest';

import type { JobApplication } from '@lib/types';

import {
  calendarDay,
  cardMatches,
  countActive,
  dateLine,
  groupByColumn,
  isLabelPicked,
  labelFilterOptions,
  labelsFromSearchParams,
  movePatch,
  needsFollowUp,
  searchWithLabels,
  sortOrderAt,
  sortOrderAtEnd,
  sortOrderBetween,
  toggleLabel,
} from './board';

function card(overrides: Partial<JobApplication>): JobApplication {
  return {
    id: 'a1',
    position: 'Staff Engineer',
    company: 'Northwind',
    stage: 'saved',
    sortOrder: 0,
    location: null,
    salary: null,
    contact: null,
    appliedOn: null,
    nextStepOn: null,
    nextStep: null,
    resumeId: null,
    labels: [],
    links: [],
    stageChangedAt: '2026-11-15T12:00:00.000Z',
    createdAt: '2026-11-15T12:00:00.000Z',
    updatedAt: '2026-11-15T12:00:00.000Z',
    ...overrides,
  };
}

const now = new Date('2026-11-20T12:00:00');

describe('groupByColumn', () => {
  it('puts each card in its column, the three outcomes in Closed, ordered by sort_order then age', () => {
    const columns = groupByColumn([
      card({ id: 'b', stage: 'applied', sortOrder: 2 }),
      card({ id: 'a', stage: 'applied', sortOrder: 1 }),
      card({ id: 'c', stage: 'applied', sortOrder: 1, createdAt: '2026-11-16T00:00:00.000Z' }),
      card({ id: 'r', stage: 'rejected' }),
      card({ id: 'w', stage: 'withdrawn' }),
    ]);
    expect(columns.applied.map((item) => item.id)).toEqual(['a', 'c', 'b']);
    expect(columns.closed.map((item) => item.id).sort()).toEqual(['r', 'w']);
    expect(columns.saved).toEqual([]);
  });

  it('counts every stage but the closed outcomes as active', () => {
    expect(
      countActive([card({ stage: 'saved' }), card({ stage: 'offer' }), card({ stage: 'accepted' }), card({ stage: 'rejected' })]),
    ).toBe(2);
  });
});

describe('label filters', () => {
  const remote = { name: 'Remote', color: 'green' as const };
  const top = { name: 'Top choice', color: 'blue' as const };
  const cards = [
    card({ id: 'a', labels: [remote, top] }),
    card({ id: 'b', labels: [{ name: 'remote', color: 'amber' }] }),
    card({ id: 'c', position: 'Designer', company: 'Fjord', labels: [] }),
  ];

  it('offers one chip per label name, sorted, the first colour winning', () => {
    expect(labelFilterOptions(cards)).toEqual([remote, top]);
  });

  it('keeps cards that carry every picked label, ignoring case', () => {
    expect(cards.filter((item) => cardMatches(item, { search: '', labels: ['Remote'] })).map((item) => item.id)).toEqual(['a', 'b']);
    expect(
      cards.filter((item) => cardMatches(item, { search: '', labels: ['remote', 'Top choice'] })).map((item) => item.id),
    ).toEqual(['a']);
  });

  it('searches position and company and combines with the labels', () => {
    expect(cards.filter((item) => cardMatches(item, { search: 'fjord', labels: [] })).map((item) => item.id)).toEqual(['c']);
    expect(cards.filter((item) => cardMatches(item, { search: 'designer', labels: ['Remote'] }))).toEqual([]);
  });

  it('reads and writes the picked labels in the URL', () => {
    expect(labelsFromSearchParams(new URLSearchParams('labels=Remote&labels=%20&labels=remote&labels=Top+choice'))).toEqual([
      'Remote',
      'Top choice',
    ]);
    expect(searchWithLabels('?x=1&labels=Old', ['Remote', 'Top choice'])).toBe('?x=1&labels=Remote&labels=Top+choice');
    expect(searchWithLabels('?labels=Old', [])).toBe('');
  });

  it('toggles a picked label regardless of case', () => {
    expect(toggleLabel(['Remote'], 'remote')).toEqual([]);
    expect(toggleLabel(['Remote'], 'Top choice')).toEqual(['Remote', 'Top choice']);
    expect(isLabelPicked(['Remote'], 'REMOTE')).toBe(true);
  });
});

describe('sort order', () => {
  const shown = [card({ id: 'a', sortOrder: 1 }), card({ id: 'b', sortOrder: 2 })];

  it('takes the midpoint between neighbours and steps by 1 past either end', () => {
    expect(sortOrderBetween(1, 2)).toBe(1.5);
    expect(sortOrderBetween(undefined, 1)).toBe(0);
    expect(sortOrderBetween(2, undefined)).toBe(3);
    expect(sortOrderBetween()).toBe(0);
  });

  it('places a dropped card among the cards shown', () => {
    expect(sortOrderAt(shown, 0)).toBe(0);
    expect(sortOrderAt(shown, 1)).toBe(1.5);
    expect(sortOrderAt(shown, 2)).toBe(3);
    expect(sortOrderAt([], 0)).toBe(0);
    expect(sortOrderAtEnd(shown)).toBe(3);
  });
});

describe('date line', () => {
  it('reads Saved, Applied, Interview since, Offer received and Closed with the stage date', () => {
    expect(dateLine(card({ stage: 'saved' }), now)).toBe('Saved 15 Nov');
    expect(dateLine(card({ stage: 'applied', appliedOn: '2026-11-14' }), now)).toBe('Applied 14 Nov');
    expect(dateLine(card({ stage: 'applied' }), now)).toBe('Applied 15 Nov');
    expect(dateLine(card({ stage: 'interview' }), now)).toBe('Interview since 15 Nov');
    expect(dateLine(card({ stage: 'offer' }), now)).toBe('Offer received 15 Nov');
    expect(dateLine(card({ stage: 'rejected' }), now)).toBe('Closed 15 Nov');
  });

  it('shows the next step when one is set, except on closed cards', () => {
    expect(dateLine(card({ stage: 'interview', nextStepOn: '2026-11-24' }), now)).toBe('Next step 24 Nov');
    expect(dateLine(card({ stage: 'accepted', nextStepOn: '2026-11-24' }), now)).toBe('Closed 15 Nov');
  });

  it('adds the year outside the current one', () => {
    expect(dateLine(card({ stage: 'applied', appliedOn: '2025-12-30' }), now)).toBe('Applied 30 Dec 2025');
  });

  it('asks to follow up on an Applied card unchanged for 14 days', () => {
    expect(needsFollowUp(card({ stage: 'applied', stageChangedAt: '2026-11-06T12:00:00' }), now)).toBe(true);
    expect(needsFollowUp(card({ stage: 'applied', stageChangedAt: '2026-11-07T12:00:00' }), now)).toBe(false);
    expect(needsFollowUp(card({ stage: 'interview', stageChangedAt: '2026-10-01T12:00:00' }), now)).toBe(false);
  });

  it('reads a date as a calendar day', () => {
    expect(calendarDay('2026-11-14').toISOString()).toBe('2026-11-14T00:00:00.000Z');
  });
});

describe('movePatch', () => {
  it('sets the stage and order, and fills an empty applied-on date when moving into Applied', () => {
    expect(movePatch(card({ stage: 'saved' }), 'applied', 2, now)).toEqual({ stage: 'applied', sortOrder: 2, appliedOn: '2026-11-20' });
    expect(movePatch(card({ stage: 'saved', appliedOn: '2026-11-01' }), 'applied', 2, now)).toEqual({ stage: 'applied', sortOrder: 2 });
    expect(movePatch(card({ stage: 'applied', appliedOn: '2026-11-01' }), 'applied', 3, now)).toEqual({ sortOrder: 3 });
  });
});
