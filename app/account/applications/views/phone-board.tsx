'use client';

import { useId, useState, type KeyboardEvent } from 'react';

import { COLUMN_EMPTY_HINTS, COLUMN_NAMES, STAGE_TABS_LABEL } from '@/lib/applications-copy';
import { BOARD_COLUMNS } from '@lib/schema/application.schema';
import type { ApplicationStage, BoardColumn, JobApplication } from '@lib/types';
import { cn } from '@lib/utils';

import type { BoardColumns } from '../board';
import { ApplicationCard } from './application-card';

type PhoneBoardProps = {
  columns: BoardColumns;
  now: Date;
  emptyHint?: string;
  onMove: (application: JobApplication, stage: ApplicationStage) => void;
  onOpen: (application: JobApplication) => void;
};

/** Below md: one stage at a time, as tabs with counts. Cards move with their Move to… menu; there is no drag. */
export function PhoneBoard({ columns, now, emptyHint, onMove, onOpen }: PhoneBoardProps) {
  const [tab, setTab] = useState<BoardColumn>(() => BOARD_COLUMNS.find((column) => columns[column].length > 0) ?? 'saved');
  const baseId = useId();
  const tabId = (column: BoardColumn) => `${baseId}-tab-${column}`;
  const panelId = `${baseId}-panel`;
  const cards = columns[tab];

  // Arrow keys move between tabs, as in the WAI-ARIA tabs pattern.
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) {
      return;
    }
    event.preventDefault();
    const index = (BOARD_COLUMNS.indexOf(tab) + step + BOARD_COLUMNS.length) % BOARD_COLUMNS.length;
    const next = BOARD_COLUMNS[index];
    setTab(next);
    document.getElementById(tabId(next))?.focus();
  };

  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" aria-label={STAGE_TABS_LABEL} className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
        {BOARD_COLUMNS.map((column) => {
          const selected = column === tab;
          return (
            <button
              key={column}
              id={tabId(column)}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => setTab(column)}
              onKeyDown={onKeyDown}
              className={cn(
                'h-[4rem] shrink-0 rounded-full border px-3.5 text-sm whitespace-nowrap outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                selected
                  ? 'border-secondary bg-secondary font-semibold text-secondary-foreground dark:border-[#7375e5] dark:bg-[#7375e5] dark:text-[#0d0d0d]'
                  : 'border-input bg-background font-medium text-foreground',
              )}
            >
              {COLUMN_NAMES[column]} {columns[column].length}
            </button>
          );
        })}
      </div>
      <div id={panelId} role="tabpanel" aria-labelledby={tabId(tab)}>
        {cards.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {cards.map((card) => (
              <li key={card.id} className="list-none">
                <ApplicationCard
                  application={card}
                  now={now}
                  surface="list"
                  onMove={(stage) => onMove(card, stage)}
                  onOpen={() => onOpen(card)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-[1rem] border border-dashed border-[#b8b9f2] px-2 py-4 text-center text-[1.3rem] text-muted-foreground dark:border-[#696a6e]">
            {emptyHint ?? COLUMN_EMPTY_HINTS[tab]}
          </p>
        )}
      </div>
    </div>
  );
}
