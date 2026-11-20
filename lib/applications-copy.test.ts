import { describe, expect, it } from 'vitest';

import {
  ADD_APPLICATION_LABEL,
  APPLICATIONS_TITLE,
  COLUMN_EMPTY_HINTS,
  COLUMN_NAMES,
  EMPTY_BODY,
  EMPTY_CTA_LABEL,
  EMPTY_TITLE,
  NO_MATCHING_CARDS,
  RESUMES_LOAD_ERROR,
  OUTCOME_NAMES,
  STAGE_NAMES,
  applicationsSummary,
  cardDate,
  filteredSummary,
  moveCardLabel,
  stageTabLabel,
} from './applications-copy';

describe('applications copy', () => {
  it('uses the approved headings and actions', () => {
    expect(APPLICATIONS_TITLE).toBe('Applications');
    expect(ADD_APPLICATION_LABEL).toBe('Add application');
    expect(EMPTY_TITLE).toBe('Keep track of every application');
    expect(EMPTY_BODY).toBe(
      'Save a job you like, note when you applied and which resume you sent, and move it along as you hear back.',
    );
    expect(EMPTY_CTA_LABEL).toBe('Add your first application');
    expect(NO_MATCHING_CARDS).toBe('No cards with these labels');
    expect(RESUMES_LOAD_ERROR).toBe("Your resumes didn't load, so you can't pick one yet.");
  });

  it('names every stage, column and outcome', () => {
    expect(Object.values(STAGE_NAMES)).toEqual(['Saved', 'Applied', 'Interview', 'Offer', 'Accepted', 'Rejected', 'Withdrawn']);
    expect(Object.values(COLUMN_NAMES)).toEqual(['Saved', 'Applied', 'Interview', 'Offer', 'Closed']);
    expect(Object.values(OUTCOME_NAMES)).toEqual(['Accepted', 'Rejected', 'Withdrawn']);
    expect(COLUMN_EMPTY_HINTS.applied).toBe('Drag a card here once you apply');
  });

  it('summarises the board and a filtered board', () => {
    expect(applicationsSummary(8, 4)).toBe('8 applications · 4 active');
    expect(applicationsSummary(1, 1)).toBe('1 application · 1 active');
    expect(applicationsSummary(0, 0)).toBe('Nothing tracked yet');
    expect(filteredSummary(2, 8)).toBe('Showing 2 of 8 applications');
  });

  it('labels the move menu and the phone tabs', () => {
    expect(moveCardLabel('Tech Lead', 'Aster Mobility')).toBe('Move Tech Lead at Aster Mobility to another stage');
    expect(stageTabLabel('Applied', 3)).toBe('Applied 3');
  });

  it('formats card dates with the year only outside the current year', () => {
    const today = new Date('2026-11-20T00:00:00.000Z');
    expect(cardDate(new Date('2026-11-14T00:00:00.000Z'), today)).toBe('14 Nov');
    expect(cardDate(new Date('2025-12-30T00:00:00.000Z'), today)).toBe('30 Dec 2025');
  });
});
