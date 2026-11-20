import { format, parseISO } from 'date-fns';

/**
 * Trustpilot reviews quoted on the homepage (MDI-653, epic MDI-650). Maintained by hand: there is no paid Trustpilot
 * plan, so no API, TrustBox widget, logo, stars or TrustScore.
 *
 * Rules for adding a review:
 * - Quote it as written: in full, or cut at the end of a sentence. Never reword, fix or merge reviews.
 * - Use the reviewer's name exactly as Trustpilot shows it, and the date of the review.
 * - `url` is that review's own page on trustpilot.com.
 * - Pick fairly. The section links to every review, including critical ones.
 * - Do not add `Review` or `AggregateRating` structured data for these quotes.
 *
 * The section shows only with `trustpilotReviews` on and at least `REVIEWS_MIN_TO_SHOW` reviews here.
 */

/** Talvio's public Trustpilot profile, with every review. */
export const TRUSTPILOT_PROFILE_URL = 'https://www.trustpilot.com/review/talvio.co';

export type TrustpilotReview = {
  /** The quote, as written on Trustpilot. Under 400 characters. */
  text: string;
  /** The reviewer's name as Trustpilot shows it. */
  name: string;
  /** The review date, ISO `yyyy-MM-dd`. */
  date: string;
  /** The review's own page on trustpilot.com. */
  url: string;
};

export const REVIEWS_MIN_TO_SHOW = 3;
export const REVIEWS_SHOWN = 3;
export const REVIEW_TEXT_MAX_LENGTH = 400;

// Ships empty. Add real reviews only, newest first.
export const TRUSTPILOT_REVIEWS: readonly TrustpilotReview[] = [];

/** Problems with a review list, for the copy test. Empty when every review is usable. */
export function reviewListIssues(reviews: readonly TrustpilotReview[]): string[] {
  const issues: string[] = [];
  reviews.forEach((review, index) => {
    const where = `review ${index + 1}`;
    for (const field of ['text', 'name', 'date', 'url'] as const) {
      if (!review[field]?.trim()) {
        issues.push(`${where}: ${field} is missing`);
      }
    }
    if (review.text && review.text.length >= REVIEW_TEXT_MAX_LENGTH) {
      issues.push(`${where}: text is ${REVIEW_TEXT_MAX_LENGTH} characters or more`);
    }
    if (review.date && (!/^\d{4}-\d{2}-\d{2}$/.test(review.date) || Number.isNaN(parseISO(review.date).getTime()))) {
      issues.push(`${where}: date is not an ISO date`);
    }
    if (review.url) {
      let host = '';
      try {
        const parsed = new URL(review.url);
        host = parsed.protocol === 'https:' ? parsed.hostname : '';
      } catch {
        host = '';
      }
      if (host !== 'trustpilot.com' && !host.endsWith('.trustpilot.com')) {
        issues.push(`${where}: url is not on trustpilot.com`);
      }
    }
  });
  return issues;
}

/** The reviews the homepage shows, or none when the section stays hidden. */
export function reviewsToShow(enabled: boolean, reviews: readonly TrustpilotReview[] = TRUSTPILOT_REVIEWS) {
  if (!enabled || reviews.length < REVIEWS_MIN_TO_SHOW) {
    return [];
  }
  return reviews.slice(0, REVIEWS_SHOWN);
}

/** "12 November 2026". */
export function formatReviewDate(date: string): string {
  return format(parseISO(date), 'd MMMM yyyy');
}
