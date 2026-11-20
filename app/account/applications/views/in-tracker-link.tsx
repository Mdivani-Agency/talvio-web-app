import Link from 'next/link';

import { IN_TRACKER_LABEL, cardHref } from '@/lib/applications-copy';
import { cn } from '@lib/utils';

/** A small "In tracker" link to the card that links a resume (MDI-658). */
export function InTrackerLink({ applicationId, name, className }: { applicationId: string; name: string; className?: string }) {
  return (
    <Link
      href={cardHref(applicationId)}
      aria-label={`${IN_TRACKER_LABEL}: ${name}`}
      className={cn(
        'rounded-sm text-xs font-semibold text-secondary underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50 dark:text-[#8688ea]',
        className,
      )}
    >
      {IN_TRACKER_LABEL}
    </Link>
  );
}
