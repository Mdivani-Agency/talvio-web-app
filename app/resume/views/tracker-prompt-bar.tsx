'use client';

import { BriefcaseBusiness, Plus, X } from 'lucide-react';

import { Button } from '@components/ui';
import {
  TRACKER_PROMPT_ADD_LABEL,
  TRACKER_PROMPT_BODY,
  TRACKER_PROMPT_DISMISS_LABEL,
  TRACKER_PROMPT_TITLE,
} from '@/lib/applications-copy';

type TrackerPromptBarProps = {
  onAdd: () => void;
  onDismiss: () => void;
};

/**
 * "Applying with this resume?" at the bottom of the editor after a new PDF (MDI-658). Not a dialog: it takes no focus,
 * blocks nothing and is announced as a status. It stays until dismissed, used or the page is left.
 */
export function TrackerPromptBar({ onAdd, onDismiss }: TrackerPromptBarProps) {
  return (
    <div
      role="status"
      aria-label={TRACKER_PROMPT_TITLE}
      className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-[60rem] -translate-x-1/2 flex-wrap items-center gap-3 rounded-[1.4rem] border border-input bg-background p-3 shadow-[0_8px_32px_rgba(13,13,13,0.18)] md:flex-nowrap md:p-4"
    >
      <span
        aria-hidden="true"
        className="flex size-[4rem] shrink-0 items-center justify-center rounded-[1rem] bg-popover text-secondary dark:bg-[#404040] dark:text-[#8688ea]"
      >
        <BriefcaseBusiness className="size-[2rem]" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-semibold text-primary">{TRACKER_PROMPT_TITLE}</span>
        <span className="text-[1.3rem] text-muted-foreground">{TRACKER_PROMPT_BODY}</span>
      </span>
      <span className="flex items-center gap-1">
        <Button type="button" className="h-[4rem] text-sm" onClick={onAdd}>
          <Plus aria-hidden="true" className="size-[1.6rem]" />
          {TRACKER_PROMPT_ADD_LABEL}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={TRACKER_PROMPT_DISMISS_LABEL}
          className="size-[4rem] text-muted-foreground"
          onClick={onDismiss}
        >
          <X aria-hidden="true" className="size-[1.8rem]" />
        </Button>
      </span>
    </div>
  );
}
