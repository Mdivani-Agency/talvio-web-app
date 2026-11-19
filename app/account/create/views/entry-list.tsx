'use client';

import { GripVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';

import { ConfirmModal } from '@components/modals';
import { Button } from '@components/ui';
import { SortableList } from '@components/views';
import {
  ENTRY_REORDER_HINT,
  ENTRY_SAVE_LABEL,
  entryEditTitle,
  entryMovedAnnouncement,
  entryRemoveBody,
  entryRemoveLabel,
  entryReorderLabel,
  type EntryListCopy,
} from '@/lib/onboarding-copy';

import type { EntrySummary } from './entry-summaries';

type Entry = { id: string };

/** Props each list hands its entry form: Add or Save, and Cancel to close it. */
export type EntryFormProps<T> = {
  defaultValues?: T;
  submitLabel: string;
  onSubmit: (value: T) => void;
  onCancel: () => void;
};

type EntryListProps<T extends Entry> = {
  items: T[];
  copy: EntryListCopy;
  summarize: (item: T) => EntrySummary;
  renderForm: (props: EntryFormProps<T>) => ReactNode;
  onAdd: (item: T) => void;
  onUpdate: (index: number, item: T) => void;
  onRemove: (index: number) => void;
  onReorder: (items: T[]) => void;
};

/** Move one entry up or down. Exported for the tests. */
export function moveEntry<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length || from === to) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved as T);
  return next;
}

/**
 * Saved entries as rows (drag handle, title, subline, Edit, Remove) with an inline form below them for a new entry.
 * Edit swaps a row for the same form. The handle also moves an entry with the up and down arrow keys.
 */
export function EntryList<T extends Entry>({
  items,
  copy,
  summarize,
  renderForm,
  onAdd,
  onUpdate,
  onRemove,
  onReorder,
}: EntryListProps<T>) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [removeIndex, setRemoveIndex] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const hintId = useId();
  const removing = removeIndex === null ? undefined : items[removeIndex];

  const move = (index: number, to: number) => {
    const next = moveEntry(items, index, to);
    if (next === items) return;
    onReorder(next);
    setAnnouncement(entryMovedAnnouncement(summarize(items[index] as T).name, to + 1, items.length));
  };

  return (
    <div className="flex flex-col gap-4">
      {items.length === 0 && !adding ? <p className="text-sm text-muted-foreground">{copy.empty}</p> : null}
      {items.length > 0 ? (
        <SortableList
          items={items}
          className="space-y-2"
          itemClassName="block bg-background p-0 shadow-none"
          canDrag={editingId === null}
          showHandle={false}
          onReorder={onReorder}
          renderItem={({ item, index }) => {
            const summary = summarize(item);
            if (editingId === item.id) {
              return (
                <EntryFormFrame title={entryEditTitle(summary.title)}>
                  {renderForm({
                    defaultValues: item,
                    submitLabel: ENTRY_SAVE_LABEL,
                    onSubmit: (value) => {
                      onUpdate(index, { ...item, ...value });
                      setEditingId(null);
                    },
                    onCancel: () => setEditingId(null),
                  })}
                </EntryFormFrame>
              );
            }
            return (
              <div className="flex min-w-0 items-center gap-2 py-2 pr-2 pl-1">
                <button
                  type="button"
                  aria-label={entryReorderLabel(summary.name)}
                  aria-describedby={hintId}
                  disabled={editingId !== null || items.length < 2}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                      event.preventDefault();
                      move(index, index + (event.key === 'ArrowUp' ? -1 : 1));
                    }
                  }}
                  className="flex h-[4.4rem] w-8 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-default disabled:opacity-40"
                >
                  <GripVertical aria-hidden="true" className="size-4" />
                </button>
                <div className="flex min-w-0 flex-1 flex-col">
                  <h3 className="text-md font-semibold break-words text-primary">{summary.title}</h3>
                  {summary.subline ? (
                    <p data-allow-small-text className="text-[1.3rem] break-words text-muted-foreground">
                      {summary.subline}
                    </p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="size-[4.4rem] shrink-0 p-0"
                  aria-label={entryEditTitle(summary.name)}
                  onClick={() => {
                    setAdding(false);
                    setEditingId(item.id);
                  }}
                >
                  <Pencil aria-hidden="true" className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="size-[4.4rem] shrink-0 p-0 text-destructive hover:text-destructive"
                  aria-label={entryRemoveLabel(summary.name)}
                  onClick={() => setRemoveIndex(index)}
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </Button>
              </div>
            );
          }}
        />
      ) : null}
      <p id={hintId} className="sr-only">
        {ENTRY_REORDER_HINT}
      </p>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      {adding ? (
        <EntryFormFrame title={copy.newTitle}>
          {renderForm({
            submitLabel: copy.addLabel,
            onSubmit: (value) => {
              onAdd(value);
              setAdding(false);
            },
            onCancel: () => setAdding(false),
          })}
        </EntryFormFrame>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="h-[4rem] self-start"
          onClick={() => {
            setEditingId(null);
            setAdding(true);
          }}
        >
          <Plus aria-hidden="true" className="size-4" />
          {copy.addLabel}
        </Button>
      )}
      <ConfirmModal
        isOpen={removing !== undefined}
        title={copy.removeTitle}
        description={removing ? entryRemoveBody(summarize(removing).name) : ''}
        icon="TrashBin"
        className="text-error"
        onClose={() => setRemoveIndex(null)}
        onConfirm={() => {
          if (removeIndex !== null) onRemove(removeIndex);
          setRemoveIndex(null);
        }}
      />
    </div>
  );
}

function EntryFormFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-md border bg-background p-4 md:p-5">
      <h3 className="text-md font-semibold text-primary">{title}</h3>
      {children}
    </div>
  );
}
