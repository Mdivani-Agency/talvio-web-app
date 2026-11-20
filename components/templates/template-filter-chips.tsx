'use client';

import { cn } from '@lib/utils';
import {
  TEMPLATE_FILTER_GROUP_LABEL,
  TEMPLATE_FILTERS,
  templateFilterLabel,
  type TemplateFilter,
} from '@/lib/templates-page-copy';

type TemplateFilterChipsProps = {
  value: TemplateFilter | 'all';
  counts: Record<TemplateFilter | 'all', number>;
  onChange: (value: TemplateFilter | 'all') => void;
  /** `page` wraps and centres from md; `panel` (the editor's Design tab) is always one scrolling row. */
  variant?: 'page' | 'panel';
  className?: string;
};

/** Who a template suits, as toggle chips with a count each. Shared by `/templates` and the editor's Design tab. */
export function TemplateFilterChips({ value, counts, onChange, variant = 'page', className }: TemplateFilterChipsProps) {
  return (
    <div
      role="group"
      aria-label={TEMPLATE_FILTER_GROUP_LABEL}
      className={cn(
        'flex gap-2 overflow-x-auto [scrollbar-width:none]',
        variant === 'page' ? '-mx-4 px-4 md:mx-0 md:flex-wrap md:justify-center md:px-0' : '-mx-1 px-1 pb-1',
        className,
      )}
    >
      {TEMPLATE_FILTERS.map(({ id, label }) => {
        const selected = value === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(id)}
            className={cn(
              'shrink-0 rounded-full border whitespace-nowrap outline-none hover:cursor-pointer focus-visible:ring-[3px] focus-visible:ring-ring/50',
              // 44px on a phone. The spacing scale has no 11, so h-11 would be 27.5px.
              variant === 'page' ? 'h-[4.4rem] px-[1.4rem] text-md md:h-10' : 'h-[4.4rem] px-3 text-[1.3rem] md:h-9',
              selected
                ? 'border-primary bg-primary font-semibold text-background'
                : 'border-border bg-transparent font-medium text-foreground hover:border-foreground/40',
            )}
          >
            {templateFilterLabel(label, counts[id] ?? 0)}
          </button>
        );
      })}
    </div>
  );
}
