'use client';

import { Check } from 'lucide-react';
import Image from 'next/image';
import { useState, type KeyboardEvent } from 'react';

import type { TemplateKey, TemplateList } from '@lib/types';
import { cn, RESUME_COLORS_MAP } from '@lib/utils';
import { ACCENT_COLOURS, DESIGN_PANEL, templateButtonLabel } from '@/lib/resume-editor-copy';
import { Loading } from '@components/views';

type Level = 'entry' | 'mid' | 'senior';
type Size = 'sm' | 'md' | 'lg';

type DesignPanelProps = {
  templates?: TemplateList;
  level: Level;
  template: TemplateKey;
  color: string;
  fontSize: Size;
  disabled?: boolean;
  onTemplate: (key: TemplateKey) => void;
  onColor: (color: string) => void;
  onFontSize: (size: Size) => void;
};

const CARD = 'flex flex-col gap-3 rounded-[1.2rem] bg-card p-4 md:p-5';
const HEADING = 'text-md font-semibold text-primary';
const SEGMENT = 'flex gap-1 rounded-[1rem] bg-accent p-1';
const SEGMENT_ITEM =
  'h-[4rem] flex-1 rounded-md text-sm font-medium text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50';
const SEGMENT_ON = 'bg-background font-semibold text-foreground shadow-[0_1px_3px_rgba(13,13,13,0.15)]';

/** Arrow keys, Home and End move a radio group's choice, as for any radio group. Exported for the tests. */
export function nextRadioIndex(key: string, index: number, count: number): number | null {
  if (key === 'ArrowRight' || key === 'ArrowDown') return (index + 1) % count;
  if (key === 'ArrowLeft' || key === 'ArrowUp') return (index - 1 + count) % count;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  return null;
}

function onRadioKey<T>(event: KeyboardEvent<HTMLElement>, values: readonly T[], index: number, pick: (value: T) => void) {
  const next = nextRadioIndex(event.key, index, values.length);
  if (next === null) return;
  event.preventDefault();
  pick(values[next] as T);
  const group = event.currentTarget.parentElement;
  (group?.children[next] as HTMLElement | undefined)?.focus();
}

/** The Design tab: the template gallery by level, the accent colour and the text size. */
export function DesignPanel({
  templates,
  level: initialLevel,
  template,
  color,
  fontSize,
  disabled = false,
  onTemplate,
  onColor,
  onFontSize,
}: DesignPanelProps) {
  const [level, setLevel] = useState<Level>(initialLevel);
  const levelName = DESIGN_PANEL.levels.find((item) => item.value === level)?.name ?? '';
  const colourIndex = ACCENT_COLOURS.findIndex((item) => RESUME_COLORS_MAP[item.key].toLowerCase() === color.toLowerCase());
  const sizeIndex = DESIGN_PANEL.sizes.findIndex((item) => item.value === fontSize);

  return (
    <div className="flex flex-col gap-3">
      <section aria-labelledby="design-template" className={CARD}>
        <h2 id="design-template" className={HEADING}>
          {DESIGN_PANEL.template}
        </h2>
        <div role="group" aria-label={DESIGN_PANEL.levelsLabel} className={SEGMENT}>
          {DESIGN_PANEL.levels.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={level === item.value}
              onClick={() => setLevel(item.value)}
              className={cn(SEGMENT_ITEM, level === item.value && SEGMENT_ON)}
            >
              {item.name}
            </button>
          ))}
        </div>
        {templates ? (
          <ul className="grid grid-cols-2 gap-3">
            {templates[level].map(({ name, imageUrl, key }) => {
              const selected = template === key;
              return (
                <li key={key}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    aria-label={templateButtonLabel(name, levelName)}
                    disabled={disabled}
                    onClick={() => onTemplate(key)}
                    className={cn(
                      'flex w-full flex-col gap-2 rounded-[1rem] bg-background p-2 text-left ring-1 ring-border focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-60',
                      selected && 'ring-2 ring-secondary dark:ring-secondary-hover',
                    )}
                  >
                    <span className="relative block aspect-[210/297] w-full overflow-hidden rounded-sm bg-white">
                      <Image src={imageUrl} alt="" fill sizes="(max-width: 768px) 45vw, 200px" className="object-cover object-top" />
                    </span>
                    <span className="flex items-center justify-between gap-2 px-1 text-sm font-semibold text-foreground">
                      {name}
                      {selected ? (
                        <span className="flex size-5 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                          <Check aria-hidden="true" className="size-3.5" strokeWidth={3} />
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <Loading message="Loading resume templates..." />
        )}
      </section>
      <section aria-labelledby="design-accent" className={CARD}>
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="design-accent" className={HEADING}>
            {DESIGN_PANEL.accent}
          </h2>
          <span className="text-sm text-muted-foreground">{ACCENT_COLOURS[colourIndex]?.name}</span>
        </div>
        <div role="radiogroup" aria-labelledby="design-accent" className="flex flex-wrap gap-2">
          {ACCENT_COLOURS.map((item, index) => {
            const checked = index === colourIndex;
            const hex = RESUME_COLORS_MAP[item.key];
            return (
              <button
                key={item.key}
                type="button"
                role="radio"
                aria-checked={checked}
                aria-label={item.name}
                tabIndex={checked || (colourIndex === -1 && index === 0) ? 0 : -1}
                disabled={disabled}
                onClick={() => onColor(hex)}
                onKeyDown={(event) => onRadioKey(event, ACCENT_COLOURS, index, (next) => onColor(RESUME_COLORS_MAP[next.key]))}
                className={cn(
                  'flex size-[4.4rem] items-center justify-center rounded-full p-1 ring-2 ring-transparent focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-60',
                  checked && 'ring-foreground',
                )}
              >
                <span className="flex size-full items-center justify-center rounded-full text-white" style={{ background: hex }}>
                  {checked ? <Check aria-hidden="true" className="size-4" strokeWidth={3} /> : null}
                </span>
              </button>
            );
          })}
        </div>
      </section>
      <section aria-labelledby="design-size" className={CARD}>
        <h2 id="design-size" className={HEADING}>
          {DESIGN_PANEL.textSize}
        </h2>
        <div role="radiogroup" aria-labelledby="design-size" className={SEGMENT}>
          {DESIGN_PANEL.sizes.map((size, index) => {
            const checked = index === sizeIndex;
            return (
              <button
                key={size.value}
                type="button"
                role="radio"
                aria-checked={checked}
                tabIndex={checked ? 0 : -1}
                disabled={disabled}
                onClick={() => onFontSize(size.value)}
                onKeyDown={(event) => onRadioKey(event, DESIGN_PANEL.sizes, index, (next) => onFontSize(next.value))}
                className={cn(SEGMENT_ITEM, checked && SEGMENT_ON)}
              >
                {size.name}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
