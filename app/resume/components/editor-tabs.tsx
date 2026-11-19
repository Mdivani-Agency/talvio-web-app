'use client';

import { useRef, type KeyboardEvent } from 'react';

import { cn } from '@lib/utils';
import { EDITOR_PANELS_LABEL, EDITOR_TABS, EDITOR_VIEWS_LABEL, TAB_HAS_ERRORS } from '@/lib/resume-editor-copy';

export type EditorView = 'content' | 'design' | 'preview';

type EditorTabsProps = {
  view: EditorView;
  onView: (view: EditorView) => void;
  /** Puts a red dot on Content while the last download found issues. */
  hasIssues: boolean;
  /** `panel`: Content and Design above the form, from `md`. `phone`: Content, Design and Preview. */
  variant: 'panel' | 'phone';
  className?: string;
};

/** A segmented tab list. Left and right arrows, Home and End move between tabs, as for any tab list. */
export function EditorTabs({ view, onView, hasIssues, variant, className }: EditorTabsProps) {
  const tabs: EditorView[] = variant === 'phone' ? ['content', 'design', 'preview'] : ['content', 'design'];
  const current: EditorView = variant === 'panel' && view === 'preview' ? 'content' : view;
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = tabs.length - 1;
    const next =
      event.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
        : event.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
          : event.key === 'Home' ? 0
            : event.key === 'End' ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    onView(tabs[next] as EditorView);
    refs.current[next]?.focus();
  };

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={variant === 'phone' ? EDITOR_VIEWS_LABEL : EDITOR_PANELS_LABEL}
        className="flex gap-1 rounded-[1rem] bg-accent p-1"
      >
        {tabs.map((tab, index) => {
          const selected = current === tab;
          return (
            <button
              key={tab}
              ref={(element) => {
                refs.current[index] = element;
              }}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-label={tab === 'content' && hasIssues ? `${EDITOR_TABS[tab]}, ${TAB_HAS_ERRORS}` : undefined}
              tabIndex={selected ? 0 : -1}
              onClick={() => onView(tab)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={cn(
                'flex h-[4rem] flex-1 items-center justify-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                selected && 'bg-background font-semibold text-foreground shadow-[0_1px_3px_rgba(13,13,13,0.15)]',
              )}
            >
              {EDITOR_TABS[tab]}
              {tab === 'content' && hasIssues ? (
                <span aria-hidden="true" className="size-2 rounded-full bg-destructive" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
