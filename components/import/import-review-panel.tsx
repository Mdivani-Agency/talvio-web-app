import { ListChecks } from 'lucide-react';
import { useId } from 'react';

import type { ImportReview } from '@lib/llm/parse-document';
import { goToSectionLabel, importReviewSubtitle, importReviewTitle } from '@/lib/onboarding-copy';

export type ImportReviewTarget = { href: string; label: string };

/**
 * What to check after an import (MDI-674, canvas OBF-review and OBF-partial): a panel at the top of the page with
 * each `ImportReview` item and a link to its part of the form. It replaces the warning toast; the page keeps it until
 * the profile is saved.
 */
export function ImportReviewPanel({
  review,
  source,
  targetFor,
}: {
  review: ImportReview;
  /** Where the details came from: the PDF's file name, or "your pasted text". */
  source: string;
  /** The link for an item's section, or null when the form has no place for it. */
  targetFor: (section: string) => ImportReviewTarget | null;
}) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      data-testid="import-review"
      className="flex flex-col gap-3 rounded-[1.2rem] border border-[#c9cbf4] bg-card p-5 dark:border-[#3b3d8a] dark:bg-[#1a1a3a]"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-8 flex-none items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <ListChecks aria-hidden className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="m-0 text-[1.7rem] font-semibold text-primary">
            {importReviewTitle(source, review.partial)}
          </h2>
          <p className="m-0 mt-0.5 text-sm text-muted-foreground">
            {importReviewSubtitle(source, review.partial, review.items.length)}
          </p>
        </div>
      </div>
      {review.items.length > 0 ? (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {review.items.map((item) => {
            const target = targetFor(item.section);
            return (
              <li
                key={`${item.section}:${item.message}`}
                className="flex flex-col items-start gap-x-3 gap-y-1 rounded-md bg-background px-3 py-2.5 text-sm md:flex-row md:items-center"
              >
                <span className="min-w-0 flex-1">
                  <strong className="font-semibold">{item.section}:</strong> {item.message}
                </span>
                {target ? (
                  <a href={target.href} className="flex-none font-semibold text-secondary underline-offset-4 hover:underline">
                    {goToSectionLabel(target.label)}
                  </a>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
