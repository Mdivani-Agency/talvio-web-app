import { Button } from '@components/ui';
import {
  PRIMARY_CTA_HREF,
  PRIMARY_CTA_LABEL,
  WHATS_FREE_BODY,
  WHATS_FREE_DOC_LABEL,
  WHATS_FREE_ID,
  WHATS_FREE_NAME,
  WHATS_FREE_TITLE,
} from '@/lib/homepage-copy';
import Link from 'next/link';
import { HomeSectionHeading } from './home-section-heading';
import { HOME_SECTION_CLASS } from './nav-section';

// Placeholder text bars on each document tile. Phones show the first three.
const DOC_BARS = [
  { width: 'w-[70%]', ink: true },
  { width: 'w-[90%]', ink: false },
  { width: 'w-[60%]', ink: false },
  { width: 'w-[80%]', ink: false },
  { width: 'w-[50%]', ink: true },
  { width: 'w-[85%]', ink: false },
] as const;

/** States the monthly allowance once, where it applies, beside three decorative document tiles. */
export const WhatsFree = () => {
  return (
    <section id={WHATS_FREE_ID} className={HOME_SECTION_CLASS}>
      <div className="grid grid-cols-1 items-center gap-8 rounded-xl bg-card px-6 py-8 lg:grid-cols-2 lg:gap-16 lg:p-[5.6rem]">
        <div className="flex flex-col items-start">
          <HomeSectionHeading name={WHATS_FREE_NAME} title={WHATS_FREE_TITLE} />
          <p className="mt-5 mb-8 text-md text-foreground lg:text-lg">{WHATS_FREE_BODY}</p>
          <Button asChild size={'lg'}>
            <Link href={PRIMARY_CTA_HREF}>{PRIMARY_CTA_LABEL}</Link>
          </Button>
        </div>
        {/* The small PDF label is a decorative tag, exempt from the 16px text check. */}
        <div aria-hidden="true" data-allow-small-text className="flex justify-center gap-2.5 lg:gap-4">
          {[1, 2, 3].map((number) => (
            <div
              key={number}
              data-doc-tile
              className="flex min-h-[12.8rem] min-w-0 flex-[0_1_9.6rem] flex-col gap-1.5 overflow-hidden rounded-lg bg-background p-3 shadow-sm lg:min-h-[19.6rem] lg:flex-[0_1_14rem] lg:gap-2 lg:p-4"
            >
              <span className="self-start rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                {WHATS_FREE_DOC_LABEL}
              </span>
              {DOC_BARS.map((bar, index) => (
                <span
                  key={index}
                  className={`h-1.5 shrink-0 rounded-sm ${bar.width} ${bar.ink ? 'bg-primary' : 'bg-popover dark:bg-accent'} ${
                    bar.ink && index > 0 ? 'mt-1 lg:mt-2' : ''
                  } ${index >= 3 ? 'hidden lg:block' : ''}`}
                />
              ))}
              <span
                data-doc-number
                className="mt-auto pt-2 text-xl leading-none font-semibold text-secondary dark:text-secondary-hover lg:text-[3.2rem]"
              >
                {number}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
