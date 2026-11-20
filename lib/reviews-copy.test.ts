import { describe, expect, it } from 'vitest';

import {
  formatReviewDate,
  reviewListIssues,
  reviewsToShow,
  TRUSTPILOT_PROFILE_URL,
  TRUSTPILOT_REVIEWS,
  type TrustpilotReview,
} from './reviews-copy';

const review = (n: number): TrustpilotReview => ({
  text: `Review number ${n}. It was quick.`,
  name: `Reviewer ${n}`,
  date: '2026-11-12',
  url: `https://www.trustpilot.com/reviews/${n}`,
});

describe('Trustpilot reviews', () => {
  it('links to the talvio.co profile on Trustpilot', () => {
    expect(TRUSTPILOT_PROFILE_URL).toBe('https://www.trustpilot.com/review/talvio.co');
  });

  it('ships an empty list, and every listed review is complete and on trustpilot.com', () => {
    expect(reviewListIssues(TRUSTPILOT_REVIEWS)).toEqual([]);
    // The section stays hidden until real reviews are added by hand.
    expect(TRUSTPILOT_REVIEWS).toHaveLength(0);
  });

  it('flags a missing field, a long quote, a bad date and a link off trustpilot.com', () => {
    expect(reviewListIssues([review(1)])).toEqual([]);
    expect(reviewListIssues([{ ...review(1), name: ' ' }])).toEqual(['review 1: name is missing']);
    expect(reviewListIssues([{ ...review(1), text: 'x'.repeat(400) }])).toEqual([
      'review 1: text is 400 characters or more',
    ]);
    expect(reviewListIssues([{ ...review(1), date: '12/11/2026' }])).toEqual(['review 1: date is not an ISO date']);
    expect(reviewListIssues([{ ...review(1), url: 'https://example.com/trustpilot.com' }])).toEqual([
      'review 1: url is not on trustpilot.com',
    ]);
    expect(reviewListIssues([{ ...review(1), url: 'https://trustpilot.com.evil.test/r' }])).toEqual([
      'review 1: url is not on trustpilot.com',
    ]);
    expect(reviewListIssues([{ ...review(1), url: 'http://www.trustpilot.com/r' }])).toEqual([
      'review 1: url is not on trustpilot.com',
    ]);
  });

  it('shows reviews only with the flag on and at least 3 in the list, at most 3', () => {
    const four = [review(1), review(2), review(3), review(4)];
    expect(reviewsToShow(false, four)).toEqual([]);
    expect(reviewsToShow(true, four.slice(0, 2))).toEqual([]);
    expect(reviewsToShow(true, four)).toEqual(four.slice(0, 3));
    expect(reviewsToShow(true)).toEqual([]);
  });

  it('writes the date out in full', () => {
    expect(formatReviewDate('2026-11-02')).toBe('2 November 2026');
  });
});
