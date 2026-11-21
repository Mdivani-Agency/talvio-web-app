'use client';

import Image from 'next/image';
import type { CSSProperties } from 'react';
import { cn } from '@lib/utils/tailwind';

/** How far each page behind peeks out past the one in front of it: 14px on a phone, 44px from `md`. */
const PEEK_CLASS = '[--carousel-peek:14px] md:[--carousel-peek:44px]';
/** Each step behind the front page is 6% smaller. */
const SCALE_STEP = 0.06;
/** Pages further than this from the front page sit at this depth, hidden, so they never peek out further. */
const MAX_DEPTH = 2;
/** Half the width a page loses per step, as a percentage of its own width. */
const HALF_STEP_PERCENT = (SCALE_STEP * 100) / 2;
const OPACITY_BY_DEPTH = [1, 0.55, 0.3] as const;

/**
 * Where a page sits relative to the page in front: next pages to the right, previous pages to the left, each step
 * behind smaller, lighter and lower in the stack. The page is scaled from its centre, so the translation adds back
 * half of the width it lost; its outer edge then sits exactly one peek past the page in front of it.
 */
export function carouselSheetStyle(index: number, currentIndex: number): CSSProperties {
  const offset = index - currentIndex;
  if (offset === 0) {
    return { zIndex: MAX_DEPTH + 1, transform: 'translateX(0) scale(1)', opacity: 1 };
  }
  const depth = Math.min(Math.abs(offset), MAX_DEPTH);
  const direction = offset > 0 ? 1 : -1;
  return {
    zIndex: MAX_DEPTH + 1 - depth,
    transform: `translateX(calc(${direction * depth} * (var(--carousel-peek) + ${HALF_STEP_PERCENT}%))) scale(${1 - SCALE_STEP * depth})`,
    opacity: Math.abs(offset) > MAX_DEPTH ? 0 : OPACITY_BY_DEPTH[depth],
  };
}

/**
 * The preview pages as a stack: the current page in front at full size, and the pages before and after it peeking out
 * behind it on either side. Changing `currentIndex` slides the pages (none under reduced motion). Only the page in
 * front is exposed to assistive technology; the page count next to the controls announces the change.
 *
 * Fills its parent, which sets the page's size; the peek draws outside that box, so the parent needs room for it.
 */
export function ImageCarousel({
  images,
  currentIndex,
  className,
}: {
  images: string[];
  currentIndex: number;
  /** The carousel is hidden below `md` unless this shows it, as the editor's phone Preview tab does. */
  className?: string;
}) {
  return (
    <div data-testid="image-carousel" className={cn('hidden relative h-full w-full md:block', PEEK_CLASS, className)}>
      {images.map((image, index) => {
        const isCurrent = index === currentIndex;
        return (
          <div
            key={image}
            data-current={isCurrent || undefined}
            aria-hidden={isCurrent ? undefined : true}
            style={carouselSheetStyle(index, currentIndex)}
            className={cn(
              // 98% of the box, centred, as the page was drawn before (`.a4-container`).
              'absolute inset-[1%] origin-center overflow-hidden bg-background',
              'transition-[transform,opacity] duration-[450ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none',
              isCurrent ? 'shadow-[0_4px_16px_rgba(13,13,13,0.18)]' : 'pointer-events-none shadow-[0_2px_8px_rgba(13,13,13,0.10)]',
            )}
          >
            <Image src={image} alt={`PDF page ${index + 1}`} fill />
          </div>
        );
      })}
    </div>
  );
}
