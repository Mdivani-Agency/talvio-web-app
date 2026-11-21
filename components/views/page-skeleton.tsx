import type { ReactNode } from 'react';

import { cn } from '@lib/utils';

/**
 * Page-load skeletons (MDI-671): a plain page load locks nothing and draws the shape of the page that follows in grey
 * with a gentle pulse, under one short status line that screen readers announce. Work that changes data or runs AI
 * uses the page lock (`PageLock`) instead.
 */

/** The announced status line, with a small spinner, above the skeleton. */
export function SkeletonStatus({ label, className }: { label: string; className?: string }) {
  return (
    <p role="status" className={cn('m-0 flex items-center gap-2.5 text-sm font-medium text-muted-foreground', className)}>
      <span
        aria-hidden
        className="size-4 flex-none animate-spin rounded-full border-2 border-popover border-t-secondary motion-reduce:animate-none"
      />
      {label}
    </p>
  );
}

/** The grey shapes. Hidden from assistive technology; the status line says what is loading. */
export function SkeletonShapes({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      aria-hidden
      data-testid="page-skeleton"
      className={cn('animate-[page-skeleton-pulse_1.6s_ease-in-out_infinite] motion-reduce:animate-none', className)}
    >
      {children}
    </div>
  );
}

/** One grey shape: `tone="line"` for text and headings, `tone="card"` for cards and panels. */
export function SkeletonBlock({ className, tone = 'line' }: { className?: string; tone?: 'line' | 'card' }) {
  return <span className={cn('block', tone === 'line' ? 'rounded-md bg-popover' : 'rounded-[1.2rem] bg-card', className)} />;
}
