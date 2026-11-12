'use client';

import { toast } from 'sonner';

import type { ImportReview } from '@lib/llm/parse-document';

/** At most this many review lines in the toast; the rest are counted. */
const MAX_LINES = 6;

export function importReviewTitle(review: ImportReview): string {
  return review.partial ? 'Part of your resume could not be read' : 'Check your imported details';
}

/** The review lines, grouped by section, for the toast and tests. */
export function ImportReviewList({ review }: { review: ImportReview }) {
  const shown = review.items.slice(0, MAX_LINES);
  const more = review.items.length - shown.length;
  return (
    <ul className="mt-1 list-disc space-y-1 pl-4 text-sm">
      {shown.map((item) => (
        <li key={`${item.section}:${item.message}`}>
          <span className="font-medium">{item.section}:</span> {item.message}
        </li>
      ))}
      {more > 0 && <li>{`${more} more to check in the form.`}</li>}
    </ul>
  );
}

/**
 * Tells the user what an import left out or could not be sure of (MDI-221). Nothing is shown when
 * the service read everything; the toast stays until it is closed when there is something to check.
 */
export function toastImportReview(review: ImportReview | null) {
  if (!review || (!review.partial && review.items.length === 0)) {
    return;
  }
  toast.warning(importReviewTitle(review), {
    description: <ImportReviewList review={review} />,
    duration: Infinity,
    closeButton: true,
  });
}
