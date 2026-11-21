'use client';

import {
  closestCorners,
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';

import { BOARD_LABEL, COLUMN_EMPTY_HINTS, COLUMN_NAMES } from '@/lib/applications-copy';
import { BOARD_COLUMNS } from '@lib/schema/application.schema';
import type { ApplicationStage, BoardColumn, JobApplication } from '@lib/types';
import { cn } from '@lib/utils';

import { dropOrder, sortOrderAt, type BoardColumns } from '../board';
import { ApplicationCard } from './application-card';
import { COLUMN_DOTS } from './tones';

type Layout = Record<BoardColumn, string[]>;

type BoardProps = {
  /** The cards shown in each column, after search and label filters. */
  columns: BoardColumns;
  now: Date;
  /** The hint in an empty column; defaults to the column's own. */
  emptyHint?: string;
  /** A card dropped in a column at a new place. */
  onDrop: (application: JobApplication, column: BoardColumn, sortOrder: number) => void;
  onMove: (application: JobApplication, stage: ApplicationStage) => void;
  onOpen: (application: JobApplication) => void;
};

function layoutOf(columns: BoardColumns): Layout {
  return Object.fromEntries(BOARD_COLUMNS.map((column) => [column, columns[column].map((card) => card.id)])) as Layout;
}

function columnOfId(layout: Layout, id: string): BoardColumn | undefined {
  if ((BOARD_COLUMNS as readonly string[]).includes(id)) {
    return id as BoardColumn;
  }
  return BOARD_COLUMNS.find((column) => layout[column].includes(id));
}

function SortableCard({
  application,
  column,
  now,
  onMove,
  onOpen,
}: {
  application: JobApplication;
  column: BoardColumn;
  now: Date;
  onMove: BoardProps['onMove'];
  onOpen: BoardProps['onOpen'];
}) {
  const { setNodeRef, listeners, transform, transition, isDragging } = useSortable({
    id: application.id,
    data: { column },
  });
  // Pointer listeners only: the card is not a focus stop or a button, so its Move to… menu is not nested in one.
  // The menu is the keyboard route.
  return (
    <li className="list-none">
      <ApplicationCard
        application={application}
        now={now}
        onMove={(stage) => onMove(application, stage)}
        onOpen={() => onOpen(application)}
        cardRef={setNodeRef}
        dragging={isDragging}
        style={{ transform: CSS.Translate.toString(transform), transition }}
        className="cursor-grab touch-manipulation active:cursor-grabbing"
        {...listeners}
      />
    </li>
  );
}

function Column({
  column,
  cards,
  now,
  emptyHint,
  onMove,
  onOpen,
}: {
  column: BoardColumn;
  cards: JobApplication[];
  now: Date;
  emptyHint?: string;
  onMove: BoardProps['onMove'];
  onOpen: BoardProps['onOpen'];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column });
  const headingId = `column-${column}`;
  return (
    <section
      ref={setNodeRef}
      aria-labelledby={headingId}
      data-testid={`column-${column}`}
      className={cn(
        'flex min-h-[20rem] min-w-0 flex-col gap-2.5 rounded-[1.4rem] bg-card p-3 transition-shadow',
        isOver && 'ring-2 ring-secondary/40',
      )}
    >
      <h2 id={headingId} className="flex items-center gap-2 text-sm font-semibold text-primary">
        <span aria-hidden="true" className={cn('size-2 rounded-full', COLUMN_DOTS[column])} />
        {COLUMN_NAMES[column]}
        <span className="font-medium text-muted-foreground">{cards.length}</span>
      </h2>
      <SortableContext id={column} items={cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col gap-2">
          {cards.map((card) => (
            <SortableCard key={card.id} application={card} column={column} now={now} onMove={onMove} onOpen={onOpen} />
          ))}
        </ul>
      </SortableContext>
      {cards.length === 0 ? (
        <p className="rounded-[1rem] border border-dashed border-[#b8b9f2] px-2 py-4 text-center text-[1.3rem] text-muted-foreground dark:border-[#696a6e]">
          {emptyHint ?? COLUMN_EMPTY_HINTS[column]}
        </p>
      ) : null}
    </section>
  );
}

/** The desktop board (md and up): five columns, drag and drop between and within them. */
export function Board({ columns, now, emptyHint, onDrop, onMove, onOpen }: BoardProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  // While a card is dragged, the board follows this layout so the card can move between columns; otherwise it
  // follows the cards it is given.
  const [dragLayout, setDragLayout] = useState<Layout | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const byId = new Map(BOARD_COLUMNS.flatMap((column) => columns[column]).map((card) => [card.id, card]));
  const layout = dragLayout ?? layoutOf(columns);
  const active = activeId ? byId.get(activeId) : undefined;

  const handleDragStart = ({ active: started }: DragStartEvent) => {
    setActiveId(String(started.id));
    setDragLayout(layoutOf(columns));
  };

  const handleDragOver = ({ active: dragged, over }: DragOverEvent) => {
    if (!over || !dragLayout) {
      return;
    }
    const id = String(dragged.id);
    const from = columnOfId(dragLayout, id);
    const to = columnOfId(dragLayout, String(over.id));
    if (!from || !to || from === to) {
      return;
    }
    const target = dragLayout[to].filter((item) => item !== id);
    const overIndex = target.indexOf(String(over.id));
    const index = overIndex === -1 ? target.length : overIndex;
    setDragLayout({
      ...dragLayout,
      [from]: dragLayout[from].filter((item) => item !== id),
      [to]: [...target.slice(0, index), id, ...target.slice(index)],
    });
  };

  const handleDragEnd = ({ active: dragged, over }: DragEndEvent) => {
    const id = String(dragged.id);
    const current = dragLayout;
    setActiveId(null);
    setDragLayout(null);
    const application = byId.get(id);
    if (!over || !current || !application) {
      return;
    }
    const column = columnOfId(current, id);
    if (!column) {
      return;
    }
    const finalIds = dropOrder(current[column], id, String(over.id), column);
    const index = finalIds.indexOf(id);
    const neighbours = finalIds.filter((item) => item !== id).map((item) => byId.get(item)!);
    const startColumn = columnOfId(layoutOf(columns), id);
    const startIndex = columns[startColumn ?? column].findIndex((card) => card.id === id);
    if (startColumn === column && startIndex === index) {
      return;
    }
    onDrop(application, column, sortOrderAt(neighbours, index));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        setDragLayout(null);
      }}
    >
      <div role="group" aria-label={BOARD_LABEL} className="grid grid-cols-5 items-start gap-3">
        {BOARD_COLUMNS.map((column) => (
          <Column
            key={column}
            column={column}
            cards={layout[column].map((id) => byId.get(id)).filter((card): card is JobApplication => Boolean(card))}
            now={now}
            emptyHint={emptyHint}
            onMove={onMove}
            onOpen={onOpen}
          />
        ))}
      </div>
      <DragOverlay>
        {active ? (
          <ApplicationCard
            application={active}
            now={now}
            onMove={() => undefined}
            className="cursor-grabbing shadow-[0_8px_24px_rgba(13,13,13,0.18)]"
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
