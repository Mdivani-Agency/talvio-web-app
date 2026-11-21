import { describe, expect, it } from 'vitest';

import {
  answerCount,
  doneTitle,
  fromAnswer,
  IMPROVE_AFTER_SAVE_HREF,
  limitBody,
  LOADING_NOTE,
  limitResetTime,
  OFFER_POINTS,
  questionCounter,
  reviewTitle,
  saveEditsLabel,
  usedBody,
  usedOnDate,
} from './profile-improve-copy';

describe('profile improvement copy', () => {
  it('counts questions, edits and characters', () => {
    expect(questionCounter(2, 5)).toBe('Question 2 of 5');
    expect(answerCount(1234)).toBe('1,234 / 2,000');
    expect(reviewTitle(1)).toBe('1 suggested edit');
    expect(reviewTitle(4)).toBe('4 suggested edits');
    expect(saveEditsLabel(0)).toBe('Save no edits');
    expect(saveEditsLabel(1)).toBe('Save 1 edit to my profile');
    expect(saveEditsLabel(3)).toBe('Save 3 edits to my profile');
    expect(doneTitle(1)).toBe('1 edit saved to your profile');
    expect(doneTitle(2)).toBe('2 edits saved to your profile');
    expect(fromAnswer(3)).toBe('From your answer to question 3');
  });

  it('says the page unlocks when the questions are ready, not that it can be left (MDI-670)', () => {
    expect(LOADING_NOTE).toBe('This can take a minute. The page unlocks when your questions are ready.');
    expect(LOADING_NOTE).not.toMatch(/leave this page/i);
  });

  it('offers three points and lands on the offer after Save profile', () => {
    expect(OFFER_POINTS.map((point) => point.title)).toEqual(['A few minutes', 'Skip any question', 'You decide']);
    expect(IMPROVE_AFTER_SAVE_HREF).toBe('/account/improve?saved=1');
  });

  it('names the day the improvement ran, when known', () => {
    expect(usedOnDate('2026-11-12T09:00:00Z')).toBe('12 November');
    expect(usedOnDate(null)).toBeNull();
    expect(usedOnDate('not a date')).toBeNull();
    expect(usedBody('12 November')).toContain('yours ran on 12 November');
    expect(usedBody(null)).toMatch(/^Each account gets it once\. /);
  });

  it('shows the 00:00 UTC reset in local time', () => {
    expect(limitResetTime('en-GB')).toMatch(/^\d{1,2}:\d{2}/);
    expect(limitBody('4:00 AM')).toContain('It resets at 4:00 AM your time.');
  });
});
