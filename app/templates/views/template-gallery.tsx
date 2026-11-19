'use client';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@components/ui';
import { listResumeTemplates } from '@lib/templates';
import type { TemplateKey } from '@lib/types';
import { cn } from '@lib/utils';
import {
  TEMPLATES_LEVELS,
  TEMPLATES_NEXT_LABEL,
  TEMPLATES_PREVIOUS_LABEL,
  TEMPLATES_USE_LABEL,
  templateCardLabel,
  templatesCarouselLabel,
  templatesDotLabel,
  templatesSlideLabel,
  type TemplatesPageLevel,
} from '@/lib/templates-page-copy';

type TemplateGalleryProps = {
  level: TemplatesPageLevel;
  onSelect: (key: TemplateKey) => void;
};

const pillClassName = 'items-center rounded-md bg-secondary text-md font-medium whitespace-nowrap text-secondary-foreground';

/**
 * The templates of one level: a grid from `md` (2 columns, 4 from `lg`) and a swipeable carousel below it, built
 * from the same list so each preview loads once. Render it with `key={level}` so a level change starts the carousel
 * at the first card.
 */
export function TemplateGallery({ level, onSelect }: TemplateGalleryProps) {
  const templates = listResumeTemplates()[level];
  const levelLabel = TEMPLATES_LEVELS.find((item) => item.id === level)?.label ?? level;
  const trackRef = useRef<HTMLUListElement>(null);
  const [slide, setSlide] = useState(0);
  const last = templates.length - 1;

  /** Each slide's scroll position, measured from the first so the track's own padding cancels out. */
  const slideOffsets = () => {
    const items = [...(trackRef.current?.children ?? [])] as HTMLElement[];
    return items.map((item) => item.offsetLeft - (items[0]?.offsetLeft ?? 0));
  };

  const goTo = (index: number) => {
    const target = Math.max(0, Math.min(last, index));
    trackRef.current?.scrollTo?.({ left: slideOffsets()[target] ?? 0, behavior: 'smooth' });
    setSlide(target);
  };

  const onScroll = () => {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    // The last card cannot reach the snap start, so the end of the track counts as the last slide.
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
    const offsets = slideOffsets();
    const nearest = offsets.reduce(
      (best, offset, index) => (Math.abs(offset - track.scrollLeft) < Math.abs(offsets[best] - track.scrollLeft) ? index : best),
      0,
    );
    const current = atEnd ? last : nearest;
    if (current !== slide) {
      setSlide(current);
    }
  };

  return (
    <section aria-roledescription="carousel" aria-label={templatesCarouselLabel(levelLabel)} className="mt-7 lg:mt-12">
      <ul
        ref={trackRef}
        onScroll={onScroll}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 lg:grid-cols-4"
      >
        {templates.map(({ key, name, description, imageUrl }, index) => (
          <li
            key={key}
            aria-roledescription="slide"
            aria-label={templatesSlideLabel(index + 1, templates.length)}
            className="w-[30rem] shrink-0 snap-start md:w-auto"
          >
            <button
              type="button"
              aria-label={templateCardLabel(name, levelLabel)}
              onClick={() => onSelect(key)}
              className="group flex w-full flex-col gap-3 rounded-lg bg-card p-3 text-left outline-none hover:cursor-pointer hover:ring-2 hover:ring-secondary focus-visible:ring-2 focus-visible:ring-secondary md:gap-4 md:p-4"
            >
              <span className="relative block aspect-[210/297] w-full overflow-hidden rounded-md bg-white shadow-sm">
                <Image
                  src={imageUrl}
                  fill
                  sizes="(min-width: 1024px) 270px, (min-width: 768px) 50vw, 300px"
                  className="object-cover object-top"
                  alt={`${level} ${name}`}
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
              <span className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-lg leading-[1.4] font-semibold text-primary">{name}</span>
                  <span className="text-md leading-[1.4] text-muted-foreground">{description}</span>
                </span>
                <span aria-hidden="true" className={cn(pillClassName, 'inline-flex h-9 shrink-0 px-3 md:hidden')}>
                  {TEMPLATES_USE_LABEL}
                </span>
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
          className="size-11 border-input p-0"
        >
          <ChevronLeft aria-hidden="true" className="size-[1.8rem]" />
        </Button>
        <div className="flex items-center gap-1">
          {templates.map(({ key, name }, index) => (
            <button
              key={key}
              type="button"
              aria-label={templatesDotLabel(name)}
              aria-current={slide === index ? 'true' : undefined}
              onClick={() => goTo(index)}
              className="flex h-11 w-6 items-center justify-center rounded-md outline-none hover:cursor-pointer focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                className={cn('block h-2 rounded-full transition-all', slide === index ? 'w-5 bg-secondary' : 'w-2 bg-input')}
              />
            </button>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          aria-label={TEMPLATES_NEXT_LABEL}
          disabled={slide === last}
          onClick={() => goTo(slide + 1)}
          className="size-11 border-input p-0"
        >
          <ChevronRight aria-hidden="true" className="size-[1.8rem]" />
        </Button>
      </div>
    </section>
  );
}
