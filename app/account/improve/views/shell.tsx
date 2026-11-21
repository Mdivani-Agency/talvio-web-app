'use client';

import { Sparkles } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';

import { cn } from '@lib/utils';
import { IMPROVE_EYEBROW } from '@/lib/profile-improve-copy';

/** The "Make your profile stronger" line above each screen's heading. */
export function Eyebrow() {
  return (
    <p className="m-0 flex items-center gap-2 text-sm font-semibold text-secondary">
      <Sparkles aria-hidden className="size-4" />
      {IMPROVE_EYEBROW}
    </p>
  );
}

/**
 * The screen's heading. It takes focus when the screen appears, so a screen reader starts each
 * step from its title (MDI-646 accessibility).
 */
export function ScreenHeading({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <h1
      id={id}
      ref={ref}
      tabIndex={-1}
      className={cn('m-0 text-xl leading-[1.25] font-semibold text-primary outline-none md:text-[2.8rem]', className)}
    >
      {children}
    </h1>
  );
}

/** A screen's card: one section, labelled by its heading. */
export function ScreenCard({
  labelledBy,
  children,
  className,
  busy,
}: {
  labelledBy: string;
  children: ReactNode;
  className?: string;
  busy?: boolean;
}) {
  return (
    <section
      aria-labelledby={labelledBy}
      aria-busy={busy || undefined}
      className={cn('flex flex-col gap-5 rounded-[1.6rem] bg-card p-5 md:p-8', className)}
    >
      {children}
    </section>
  );
}

/** Full-width on a phone, side by side from md. */
export const ACTIONS_CLASS = 'flex flex-col gap-3 md:flex-row';
export const ACTION_CLASS = 'h-[4.8rem] w-full px-5 text-[1.5rem] md:w-auto';
