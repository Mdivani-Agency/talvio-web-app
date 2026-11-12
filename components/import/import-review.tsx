'use client';

import { toast } from 'sonner';

import type { ImportReview } from '@lib/llm/parse-document';

export function importReviewTitle(review: ImportReview): string {
  return review.partial ? 'Part of your resume could not be read' : 'Check your imported details';
}

/** All review lines, grouped by section, for the toast and tests. */
export function ImportReviewList({ review }: { review: ImportReview }) {
  // Every line is listed (the list scrolls): an entry the form could not hold appears nowhere else.
  return (
    <ul className="mt-1 max-h-60 list-disc space-y-1 overflow-y-auto pl-4 text-sm" tabIndex={0} aria-label="Imported details to check">
      {review.items.map((item) => (
        <li key={`${item.section}:${item.message}`}>
          <span className="font-medium">{item.section}:</span> {item.message}
        </li>
      ))}
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
