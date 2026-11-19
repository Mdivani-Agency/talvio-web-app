'use client';

import { ChevronDown } from 'lucide-react';
import { useEffect, useId, useState } from 'react';

import { cn } from '@lib/utils';
import { LEGAL_ON_THIS_PAGE } from '@/lib/legal-copy';

export type LegalContentsItem = { id: string; heading: string };

/** How far down the screen a section's top must pass before the list moves to it. */
const READING_LINE = 1 / 3;

/** The section a reader is on: the last one whose top has scrolled above the reading line. */
function useCurrentSection(ids: string[]) {
  const [current, setCurrent] = useState(ids[0]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const sections = ids.map((id) => document.getElementById(id)).filter((el) => el !== null);
    const update = () => {
      const line = window.innerHeight * READING_LINE;
      const passed = sections.filter((section) => section.getBoundingClientRect().top <= line);
      setCurrent((passed.at(-1) ?? sections[0])?.id ?? ids[0]);
    };
    // The observer's band ends at the reading line, so it calls back whenever a section crosses it.
    const observer = new IntersectionObserver(update, {
      rootMargin: `0px 0px -${Math.round((1 - READING_LINE) * 100)}% 0px`,
    });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [ids]);

  return [current, setCurrent] as const;
}

/**
 * "On this page" for a legal document: a sticky list beside the text from `lg`, and a disclosure above the text on
 * smaller screens. Only one of the two is displayed at any width.
 */
export function LegalContents({ items }: { items: LegalContentsItem[] }) {
  const [ids] = useState(() => items.map((item) => item.id));
  const [current, setCurrent] = useCurrentSection(ids);
  const [open, setOpen] = useState(false);
  const listId = useId();

  return (
    <>
      <nav
        aria-label={LEGAL_ON_THIS_PAGE}
        // On short screens the list scrolls on its own, so every entry stays reachable below the sticky header.
        className="sticky top-[10.4rem] hidden max-h-[calc(100svh-12rem)] flex-col gap-0.5 overflow-y-auto overscroll-contain p-1 lg:flex"
      >
        <p className="mb-2 px-3 text-md font-semibold text-foreground">{LEGAL_ON_THIS_PAGE}</p>
        {items.map((item) => {
          const selected = item.id === current;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={selected ? 'location' : undefined}
              onClick={() => setCurrent(item.id)}
              className={cn(
                'rounded-md px-3 py-1.5 text-md leading-[1.4] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selected
                  ? 'bg-popover font-semibold text-foreground dark:bg-accent'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.heading}
            </a>
          );
        })}
      </nav>
      <div className="rounded-lg border border-input lg:hidden">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          onClick={() => setOpen((value) => !value)}
          className="flex min-h-12 w-full items-center justify-between rounded-lg px-4 text-md font-semibold text-foreground outline-none hover:cursor-pointer focus-visible:ring-2 focus-visible:ring-ring"
        >
          {LEGAL_ON_THIS_PAGE}
          <ChevronDown aria-hidden="true" className={cn('size-[1.8rem] transition-transform', open && 'rotate-180')} />
        </button>
        {open ? (
          <nav id={listId} aria-label={LEGAL_ON_THIS_PAGE} className="flex flex-col px-2 pb-2">
            {items.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => {
                  setCurrent(item.id);
                  setOpen(false);
                }}
                className="flex min-h-11 items-center rounded-md px-2 text-md text-foreground outline-none hover:bg-popover focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-accent"
              >
                {item.heading}
              </a>
            ))}
          </nav>
        ) : null}
      </div>
    </>
  );
}
