'use client';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@components/ui';
import { showsNewTag } from '@lib/templates';
import type { TemplateItem, TemplateKey } from '@lib/types';
import { cn } from '@lib/utils';
import {
  TEMPLATE_NEW_TAG,
  TEMPLATES_CAROUSEL_LABEL,
  TEMPLATES_NEXT_LABEL,
  TEMPLATES_PREVIOUS_LABEL,
  TEMPLATES_USE_LABEL,
  templateBestFor,
  templateCardLabel,
  templatesSlideLabel,
} from '@/lib/templates-page-copy';

type TemplateGalleryProps = {
  templates: readonly TemplateItem[];
  onSelect: (key: TemplateKey) => void;
};

const pillClassName = 'items-center rounded-md bg-secondary text-md font-medium whitespace-nowrap text-secondary-foreground';

/**
 * The templates the filter shows: a grid from `md` (2 columns, 4 from `lg`) and a swipeable carousel below it, built
 * from the same list so each preview loads once. Render it with `key={filter}` so a filter change starts the carousel
 * at the first card.
 */
export function TemplateGallery({ templates, onSelect }: TemplateGalleryProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [slide, setSlide] = useState(0);
  /** The card an arrow is scrolling to. Until the row gets there, its scroll events don't move the counter back. */
  const targetRef = useRef<number | null>(null);
  const last = templates.length - 1;

  /** Each slide's scroll position, measured from the first so the track's own padding cancels out. */
  const slideOffsets = () => {
    const items = [...(trackRef.current?.children ?? [])] as HTMLElement[];
    return items.map((item) => item.offsetLeft - (items[0]?.offsetLeft ?? 0));
  };

  const goTo = (index: number) => {
    const target = Math.max(0, Math.min(last, index));
    targetRef.current = target;
    trackRef.current?.scrollTo?.({ left: slideOffsets()[target] ?? 0, behavior: 'smooth' });
    setSlide(target);
  };

  const release = () => {
    targetRef.current = null;
  };

  const onScroll = () => {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    const offsets = slideOffsets();
    const current = offsets.reduce(
      (best, offset, index) => (Math.abs(offset - track.scrollLeft) < Math.abs(offsets[best] - track.scrollLeft) ? index : best),
      0,
    );
    if (targetRef.current !== null) {
      if (current !== targetRef.current) {
        return;
      }
      targetRef.current = null;
    }
    if (current !== slide) {
      setSlide(current);
    }
  };

  return (
    <section aria-roledescription="carousel" aria-label={TEMPLATES_CAROUSEL_LABEL} className="mt-6">
      <ul
        ref={trackRef}
        onScroll={onScroll}
        // Wherever the row stops, the counter follows it. A swipe, wheel or key takes over from an arrow's scroll.
        onScrollEnd={() => {
          targetRef.current = null;
          onScroll();
        }}
        onPointerDown={release}
        onWheel={release}
        onKeyDown={release}
        className={cn(
          '-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 [scrollbar-width:none]',
          // A spacer after the last card, the row's width less one card and gap (31.2rem), lets every card reach its
          // snap position, so each has its own scroll offset at any width below md.
          "after:block after:w-[calc(100%-31.2rem)] after:shrink-0 after:content-['']",
          'md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:after:hidden lg:grid-cols-4',
        )}
      >
        {templates.map(({ key, name, description, bestFor, imageUrl, isNew }, index) => (
          <li
            key={key}
            aria-roledescription="slide"
            aria-label={templatesSlideLabel(index + 1, templates.length)}
            className="w-[30rem] shrink-0 snap-start md:w-auto"
          >
            <button
              type="button"
              aria-label={templateCardLabel(name)}
              onClick={() => onSelect(key)}
              className="group flex w-full flex-col gap-3 rounded-lg bg-card p-3 text-left outline-none hover:cursor-pointer hover:ring-2 hover:ring-secondary focus-visible:ring-2 focus-visible:ring-secondary md:gap-4 md:p-4"
            >
              <span className="relative block aspect-[210/297] w-full overflow-hidden rounded-md bg-white shadow-sm">
                <Image
                  src={imageUrl}
                  fill
                  sizes="(min-width: 1024px) 270px, (min-width: 768px) 50vw, 300px"
                  className="object-cover object-top"
                  alt=""
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    pillClassName,
                    'absolute bottom-4 left-1/2 hidden h-10 -translate-x-1/2 px-4 opacity-0 shadow-md transition-opacity md:inline-flex',
                    'group-hover:opacity-100 group-focus-visible:opacity-100',
                  )}
                >
                  {TEMPLATES_USE_LABEL}
                </span>
              </span>
              <span className="flex min-h-[8.8rem] min-w-0 flex-col gap-1">
                <span className="flex items-center gap-2">
                  <span className="text-lg leading-[1.4] font-semibold text-primary">{name}</span>
                  {showsNewTag({ isNew }) ? (
                    <span data-allow-small-text className="rounded-md bg-popover px-2 py-0.5 text-xs font-semibold text-foreground">
                      {TEMPLATE_NEW_TAG}
                    </span>
                  ) : null}
                </span>
                <span className="text-md leading-[1.5] text-foreground">{description}</span>
                <span className="text-md leading-[1.5] text-muted-foreground">{templateBestFor(bestFor)}</span>
              </span>
              <span aria-hidden="true" className={cn(pillClassName, 'flex h-[4.4rem] w-full justify-center md:hidden')}>
                {TEMPLATES_USE_LABEL}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between gap-3 md:hidden">
        <Button
          type="button"
          variant="outline"
          aria-label={TEMPLATES_PREVIOUS_LABEL}
          disabled={slide === 0}
          onClick={() => goTo(slide - 1)}
          className="size-[4.4rem] border-input p-0"
        >
          <ChevronLeft aria-hidden="true" className="size-[1.8rem]" />
        </Button>
        <p aria-live="polite" className="text-md font-medium text-foreground">
          {templatesSlideLabel(slide + 1, templates.length)}
        </p>
        <Button
          type="button"
          variant="outline"
          aria-label={TEMPLATES_NEXT_LABEL}
          disabled={slide === last}
          onClick={() => goTo(slide + 1)}
          className="size-[4.4rem] border-input p-0"
        >
          <ChevronRight aria-hidden="true" className="size-[1.8rem]" />
        </Button>
      </div>
    </section>
  );
}
