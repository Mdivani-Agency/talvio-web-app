'use client';

import { Check } from 'lucide-react';
import Image from 'next/image';
import { useState, type KeyboardEvent } from 'react';

import { Button } from '@components/ui';
import { Loading } from '@components/views';
import { TemplateFilterChips } from '@components/templates/template-filter-chips';
import { effectiveSectionOrder } from '@lib/resume/section-order';
import { TEMPLATE_OPTIONAL_FIELDS, type OptionalTemplateField } from '@lib/template-fields';
import { filterTemplates, galleryTemplateFor, showsNewTag, templateFilterCounts } from '@lib/templates';
import type { TemplateItem, TemplateKey } from '@lib/types';
import { cn, RESUME_COLORS_MAP } from '@lib/utils';
import { ACCENT_COLOURS, DESIGN_PANEL, SECTION_ORDER_COPY, templateButtonLabel } from '@/lib/resume-editor-copy';
import { TEMPLATE_NEW_TAG, type TemplateFilter } from '@/lib/templates-page-copy';

type Size = 'sm' | 'md' | 'lg';

type DesignPanelProps = {
  templates?: readonly TemplateItem[];
  template: TemplateKey;
  /** The resume's own section order, if it has one. */
  sectionOrder?: readonly string[];
  color: string;
  fontSize: Size;
  disabled?: boolean;
  onTemplate: (key: TemplateKey) => void;
  onColor: (color: string) => void;
  onFontSize: (size: Size) => void;
  /** Fill them in: open the first optional field the selected template shows, in the Content tab. */
  onFillOptionalField?: (field: OptionalTemplateField) => void;
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

/** The Design tab: the template gallery with filters and the selected template's details, the accent colour and the text size. */
export function DesignPanel({
  templates,
  template,
  sectionOrder,
  color,
  fontSize,
  disabled = false,
  onTemplate,
  onColor,
  onFontSize,
  onFillOptionalField,
}: DesignPanelProps) {
  const [filter, setFilter] = useState<TemplateFilter | 'all'>('all');
  // An older key (`mid-level-mint`) shows as its style's card.
  const selected = galleryTemplateFor(template);
  const colourIndex = ACCENT_COLOURS.findIndex((item) => RESUME_COLORS_MAP[item.key].toLowerCase() === color.toLowerCase());
  const sizeIndex = DESIGN_PANEL.sizes.findIndex((item) => item.value === fontSize);

  return (
    <div className="flex flex-col gap-3">
      <section aria-labelledby="design-template" className={CARD}>
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="design-template" className={HEADING}>
            {DESIGN_PANEL.template}
          </h2>
          {templates ? (
            <span aria-live="polite" className="text-[1.3rem] text-muted-foreground">
              {DESIGN_PANEL.templateCount(filterTemplates(templates, filter).length, templates.length)}
            </span>
          ) : null}
        </div>
        {templates ? (
          <TemplatePicker
            templates={templates}
            filter={filter}
            onFilter={setFilter}
            selectedKey={selected?.key}
            disabled={disabled}
            onTemplate={onTemplate}
          />
        ) : (
          <Loading message="Loading resume templates..." />
        )}
        {selected ? (
          <SelectedTemplate template={selected} sectionOrder={sectionOrder} disabled={disabled} onFill={onFillOptionalField} />
        ) : null}
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

function TemplatePicker({
  templates,
  filter,
  onFilter,
  selectedKey,
  disabled,
  onTemplate,
}: {
  templates: readonly TemplateItem[];
  filter: TemplateFilter | 'all';
  onFilter: (filter: TemplateFilter | 'all') => void;
  selectedKey?: TemplateKey;
  disabled: boolean;
  onTemplate: (key: TemplateKey) => void;
}) {
  const shown = filterTemplates(templates, filter);
  return (
    <>
      <TemplateFilterChips variant="panel" value={filter} counts={templateFilterCounts(templates)} onChange={onFilter} />
      <ul className="grid grid-cols-2 gap-2.5 md:grid-cols-[repeat(auto-fill,minmax(11.8rem,1fr))]">
        {shown.map(({ name, imageUrl, key, isNew }) => {
          const isSelected = key === selectedKey;
          return (
            <li key={key}>
              <button
                type="button"
                aria-pressed={isSelected}
                aria-label={templateButtonLabel(name, isSelected)}
                disabled={disabled}
                onClick={() => onTemplate(key)}
                className={cn(
                  'flex w-full flex-col gap-1.5 rounded-[1rem] bg-background p-1.5 text-left ring-1 ring-border focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-60',
                  isSelected && 'ring-2 ring-secondary dark:ring-secondary-hover',
                )}
              >
                <span className="relative block aspect-[210/297] w-full overflow-hidden rounded-sm bg-white shadow-[0_1px_3px_rgba(13,13,13,0.15)]">
                  <Image src={imageUrl} alt="" fill sizes="(max-width: 768px) 45vw, 140px" className="object-cover object-top" />
                  {isSelected ? (
                    <span className="absolute top-1 right-1 flex size-[2.2rem] items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                      <Check aria-hidden="true" className="size-3" strokeWidth={3} />
                    </span>
                  ) : null}
                </span>
                <span className="flex flex-wrap items-center gap-1.5 px-0.5 text-[1.3rem] font-semibold text-foreground">
                  {name}
                  {showsNewTag({ isNew }) ? (
                    <span className="rounded-md bg-popover px-1.5 py-px text-[1.1rem] font-semibold">{TEMPLATE_NEW_TAG}</span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** Under the grid: what the selected template is for, its section order, and the optional fields it shows. */
function SelectedTemplate({
  template,
  sectionOrder,
  disabled,
  onFill,
}: {
  template: TemplateItem;
  sectionOrder?: readonly string[];
  disabled: boolean;
  onFill?: (field: OptionalTemplateField) => void;
}) {
  const order = effectiveSectionOrder(sectionOrder, template.template)
    .map((name) => SECTION_ORDER_COPY.shortNames[name])
    .join(', ');
  const fields = TEMPLATE_OPTIONAL_FIELDS[template.key] ?? [];
  return (
    <div className="flex flex-col gap-1 rounded-md bg-background p-3 text-[1.3rem] text-foreground">
      <p className="text-sm font-semibold text-primary">{DESIGN_PANEL.selected(template.name)}</p>
      <p>{DESIGN_PANEL.summary(template.description, template.bestFor)}</p>
      <p className="text-muted-foreground">{DESIGN_PANEL.sectionOrder(order, Boolean(sectionOrder?.length))}</p>
      {fields.length ? (
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <p>{DESIGN_PANEL.optionalFields(fields.map((field) => DESIGN_PANEL.optionalFieldNames[field]).join(', '))}</p>
          {onFill ? (
            <Button
              type="button"
              variant="outline"
              className="h-9 px-3 text-[1.3rem]"
              disabled={disabled}
              onClick={() => onFill(fields[0]!)}
            >
              {DESIGN_PANEL.fillThemIn}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
