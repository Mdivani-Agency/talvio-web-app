'use client';

import { CLEAR_FILTER_LABEL, LABEL_FILTER_GROUP_LABEL, LABEL_FILTER_TITLE } from '@/lib/applications-copy';
import type { ApplicationLabel } from '@lib/types';
import { cn } from '@lib/utils';

import { isLabelPicked } from '../board';

type LabelFiltersProps = {
  options: ApplicationLabel[];
  picked: string[];
  onToggle: (name: string) => void;
  onClear: () => void;
};

/** One toggle chip per label on any card. Hidden when no card has a label. */
export function LabelFilters({ options, picked, onToggle, onClear }: LabelFiltersProps) {
  if (options.length === 0) {
    return null;
  }
  return (
    <div
      role="group"
      aria-label={LABEL_FILTER_GROUP_LABEL}
      className="-mx-4 flex items-center gap-1.5 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0"
    >
      <span className="mr-0.5 shrink-0 text-[1.3rem] font-medium text-muted-foreground">{LABEL_FILTER_TITLE}</span>
      {options.map((label) => {
        const on = isLabelPicked(picked, label.name);
        return (
          <button
            key={label.name}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(label.name)}
            className={cn(
              'h-[3.2rem] shrink-0 rounded-full border px-3 text-[1.3rem] whitespace-nowrap outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
              on
                ? 'border-secondary bg-secondary font-semibold text-secondary-foreground dark:border-[#7375e5] dark:bg-[#7375e5] dark:text-[#0d0d0d]'
                : 'border-input bg-background font-medium text-foreground',
            )}
          >
            {label.name}
          </button>
        );
      })}
      {picked.length > 0 ? (
        <button
          type="button"
          onClick={onClear}
          className="h-[3.2rem] shrink-0 rounded-md px-2 text-[1.3rem] font-medium text-secondary outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:text-[#8688ea]"
        >
          {CLEAR_FILTER_LABEL}
        </button>
      ) : null}
    </div>
  );
}
