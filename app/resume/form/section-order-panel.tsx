'use client';

import { useId, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, GripVertical, Info } from 'lucide-react';

import { Button } from '@components/ui';
import { SortableList } from '@components/views/sortable-list';
import { cn } from '@lib/utils';
import { moveSection, type MovableSection } from '@lib/resume/section-order';
import { SECTION_ORDER_COPY as COPY } from '@/lib/resume-editor-copy';

type SectionOrderLineProps = {
  order: readonly MovableSection[];
  custom: boolean;
  templateName: string;
  disabled?: boolean;
  onReorder: () => void;
};

/** Under Contact information: the order the sections print in, whose order it is, and Reorder sections. */
export function SectionOrderLine({ order, custom, templateName, disabled, onReorder }: SectionOrderLineProps) {
  return (
    <div className="flex flex-none flex-wrap items-center justify-between gap-3 px-1 pt-1">
      <p data-allow-small-text className="min-w-0 flex-1 text-[1.3rem] text-muted-foreground">
        <span className="font-semibold text-foreground">
          {custom ? COPY.yourOrder : COPY.templateOrder(templateName)}
        </span>{' '}
        {order.map((name) => COPY.shortNames[name]).join(', ')}
      </p>
      <Button
        type="button"
        variant="outline"
        className="h-10 px-3"
        onClick={onReorder}
        disabled={disabled}
        data-reorder-sections
      >
        <GripVertical aria-hidden="true" className="size-4" />
        {COPY.reorder}
      </Button>
    </div>
  );
}

type SectionOrderPanelProps = {
  order: readonly MovableSection[];
  custom: boolean;
  templateName: string;
  /** Shown for templates with a side column, where sections keep their column. */
  columnNote?: boolean;
  onChange: (order: MovableSection[]) => void;
  onReset: () => void;
  onDone: () => void;
};

/**
 * Reorder sections: one row per movable section with a drag handle, its position and Move up / Move down buttons, the
 * keyboard and phone route. Every move is announced.
 */
export function SectionOrderPanel({
  order,
  custom,
  templateName,
  columnNote = false,
  onChange,
  onReset,
  onDone,
}: SectionOrderPanelProps) {
  const titleId = useId();
  const [message, setMessage] = useState('');
  const rowsRef = useRef<HTMLDivElement>(null);
  const total = order.length;

  const move = (index: number, step: -1 | 1) => {
    const next = moveSection(order, index, step);
    if (next === order || next.every((name, i) => name === order[i])) return;
    onChange(next);
    const name = order[index]!;
    setMessage(COPY.moved(COPY.longNames[name], step < 0 ? 'up' : 'down', index + step + 1, total));
    // Keep focus on the same arrow of the moved row, so repeated presses keep moving it.
    requestAnimationFrame(() => {
      const label = step < 0 ? COPY.moveUp(COPY.longNames[name]) : COPY.moveDown(COPY.longNames[name]);
      const button = rowsRef.current?.querySelector<HTMLButtonElement>(`button[aria-label="${CSS.escape(label)}"]`);
      (button?.getAttribute('aria-disabled') === 'true'
        ? rowsRef.current?.querySelector<HTMLButtonElement>(
          `button[aria-label="${CSS.escape(step < 0 ? COPY.moveDown(COPY.longNames[name]) : COPY.moveUp(COPY.longNames[name]))}"]`,
        )
        : button
      )?.focus();
    });
  };

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-none flex-col gap-3 rounded-[1.2rem] bg-card p-4 ring-2 ring-secondary md:p-5"
    >
      <div className="flex flex-col gap-1">
        <h2 id={titleId} className="text-md font-semibold text-primary">
          {COPY.title}
        </h2>
        <p data-allow-small-text className="text-[1.3rem] text-muted-foreground">
          {COPY.intro}
        </p>
      </div>
      {/* SortableList wraps each row in a div, so the list semantics are set with roles. */}
      <div ref={rowsRef} role="list" aria-labelledby={titleId}>
        <SortableList
          items={order.map((name) => ({ id: name }))}
          className="flex flex-col gap-2 space-y-0"
          itemClassName="block bg-transparent p-0 shadow-none"
          showHandle={false}
          onReorder={(items) => {
            const next = items.map((item) => item.id as MovableSection);
            onChange(next);
            const moved = next.find((name, i) => name !== order[i]);
            if (moved) {
              const index = next.indexOf(moved);
              setMessage(
                COPY.moved(COPY.longNames[moved], index < order.indexOf(moved) ? 'up' : 'down', index + 1, total),
              );
            }
          }}
          renderItem={({ item, index }) => {
            const name = COPY.longNames[item.id as MovableSection];
            const first = index === 0;
            const last = index === total - 1;
            return (
              <div role="listitem" className="flex items-center gap-2 rounded-md bg-background py-1.5 pr-2 pl-1">
                <span
                  aria-label={COPY.drag(name)}
                  role="img"
                  className="flex h-[4.4rem] w-8 shrink-0 cursor-grab items-center justify-center text-muted-foreground"
                >
                  <GripVertical aria-hidden="true" className="size-4" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-md font-semibold text-primary">{name}</span>
                  <span data-allow-small-text className="text-[1.3rem] text-muted-foreground">
                    {COPY.position(index + 1, total)}
                  </span>
                </span>
                <ArrowButton label={COPY.moveUp(name)} disabled={first} onClick={() => move(index, -1)}>
                  <ChevronUp aria-hidden="true" className="size-4" />
                </ArrowButton>
                <ArrowButton label={COPY.moveDown(name)} disabled={last} onClick={() => move(index, 1)}>
                  <ChevronDown aria-hidden="true" className="size-4" />
                </ArrowButton>
              </div>
            );
          }}
        />
      </div>
      <p role="status" data-allow-small-text className="min-h-[1.8rem] text-[1.3rem] text-muted-foreground">
        {message}
      </p>
      {columnNote ? (
        <p className="flex items-start gap-2 text-sm text-foreground">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-secondary" />
          <span>{COPY.columnNote(templateName)}</span>
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          aria-disabled={!custom || undefined}
          onClick={() => {
            if (!custom) return;
            onReset();
            setMessage(COPY.resetDone(templateName));
          }}
          className={cn(
            'min-h-[4.4rem] text-sm font-medium text-secondary underline underline-offset-2 outline-none',
            'focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:text-secondary-hover',
            !custom && 'cursor-not-allowed opacity-40',
          )}
        >
          {COPY.reset(templateName)}
        </button>
        <Button type="button" className="h-[4.4rem] px-5 font-semibold" onClick={onDone}>
          {COPY.done}
        </Button>
      </div>
    </section>
  );
}

function ArrowButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={label}
      aria-disabled={disabled || undefined}
      onClick={() => {
        if (!disabled) onClick();
      }}
      className={cn('size-11 shrink-0', disabled && 'cursor-not-allowed opacity-35')}
    >
      {children}
    </Button>
  );
}
