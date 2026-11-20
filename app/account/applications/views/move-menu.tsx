'use client';

import { Check, MoreHorizontal } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@components/ui';
import { MOVE_MENU_TITLE, STAGE_NAMES, moveCardLabel } from '@/lib/applications-copy';
import { APPLICATION_STAGES } from '@lib/schema/application.schema';
import type { ApplicationStage, JobApplication } from '@lib/types';

type MoveMenuProps = {
  application: JobApplication;
  onMove: (stage: ApplicationStage) => void;
};

/** "Move to…": every card's keyboard and phone route to another stage. Lists all seven stages. */
export function MoveMenu({ application, onMove }: MoveMenuProps) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label={moveCardLabel(application.position, application.company)}
        title={MOVE_MENU_TITLE}
        // The drag sensors listen on the whole card; keep a press on the menu from starting a drag.
        onPointerDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        className="-mt-1 -mr-1.5 flex size-[3.2rem] shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-popover hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:hover:bg-accent/40"
      >
        <MoreHorizontal aria-hidden="true" className="size-[1.8rem]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[18rem]">
        <DropdownMenuLabel className="text-xs text-muted-foreground">{MOVE_MENU_TITLE}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {APPLICATION_STAGES.map((stage) => {
          const current = stage === application.stage;
          return (
            <DropdownMenuItem
              key={stage}
              disabled={current}
              aria-current={current ? 'true' : undefined}
              onSelect={() => onMove(stage)}
              className="min-h-[4rem] text-sm"
            >
              <span className="flex-1">{STAGE_NAMES[stage]}</span>
              {current ? <Check aria-hidden="true" className="size-4" /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
