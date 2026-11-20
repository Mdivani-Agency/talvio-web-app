import { ExternalLinkIcon } from 'lucide-react';

import {
  REVIEWS_ALL_LINK,
  REVIEWS_FOOTNOTE,
  REVIEWS_ID,
  REVIEWS_NAME,
  REVIEWS_NEW_TAB,
  REVIEWS_TITLE,
  reviewedOnTrustpilot,
} from '@/lib/homepage-copy';
import { formatReviewDate, TRUSTPILOT_PROFILE_URL, type TrustpilotReview } from '@/lib/reviews-copy';

import { HomeSectionHeading } from './home-section-heading';
import { HOME_SECTION_CLASS } from './nav-section';

// Text stays at 16px or more, as every public page does (e2e/public.spec.ts); the canvas has 13-15px for the caption,
// link and footnote.
/**
 * Selected Trustpilot reviews, quoted as text (MDI-653). No Trustpilot logo, stars, TrustScore or widget: those need a
 * paid plan. The caller decides whether to show it (`reviewsToShow`); with no reviews it renders nothing.
 */
export const Reviews = ({ reviews }: { reviews: readonly TrustpilotReview[] }) => {
  if (reviews.length === 0) {
    return null;
  }

  return (
    <section id={REVIEWS_ID} aria-labelledby={`${REVIEWS_ID}-title`} className={HOME_SECTION_CLASS}>
      <div className="mb-[2.4rem] flex flex-col items-start gap-4 lg:mb-[4rem] lg:flex-row lg:items-end lg:justify-between">
        <HomeSectionHeading name={REVIEWS_NAME} title={REVIEWS_TITLE} titleId={`${REVIEWS_ID}-title`} />
        <a
          href={TRUSTPILOT_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-2 text-md font-semibold text-secondary underline-offset-4 hover:underline dark:text-secondary-hover"
        >
          {REVIEWS_ALL_LINK}
          <span className="sr-only"> {REVIEWS_NEW_TAB}</span>
          <ExternalLinkIcon aria-hidden="true" className="size-[1.6rem]" />
        </a>
      </div>
      <ul className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {reviews.map((review) => (
          <li key={review.url}>
            <figure className="m-0 flex h-full flex-col gap-4 rounded-[1.6rem] bg-card p-[2rem] lg:p-[2.8rem]">
              <blockquote className="m-0 text-md leading-[1.6] text-foreground">“{review.text}”</blockquote>
              <figcaption className="mt-auto flex flex-col gap-0.5 text-md">
                <span className="font-semibold text-foreground">{review.name}</span>
                <a
                  href={review.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground underline underline-offset-4"
                >
                  {reviewedOnTrustpilot(formatReviewDate(review.date))}
                  <span className="sr-only"> {REVIEWS_NEW_TAB}</span>
                  <ExternalLinkIcon aria-hidden="true" className="ml-1.5 inline size-[1.3rem] align-[-0.1em]" />
                </a>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      <p className="mt-[2rem] text-md text-muted-foreground">{REVIEWS_FOOTNOTE}</p>
    </section>
  );
};
