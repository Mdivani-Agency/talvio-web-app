'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { submitWrapper } from '@app/actions/action.utils';
import { ConfirmModal } from '@components/modals';
import type { ApplicationNote } from '@/lib/adapters/application.adapter';
import {
  ADD_NOTE_LABEL,
  DELETE_NOTE_DESCRIPTION,
  DELETE_NOTE_TITLE,
  NOTE_DELETED_MESSAGE,
  NOTE_SAVE_LABEL,
  deleteNoteLabel,
  editNoteLabel,
  fullDate,
} from '@/lib/applications-copy';
import { NoteContent } from '@/lib/rich-text/note-content';

import { calendarDay } from '../../board';
import { useAddApplicationNote } from '../../query/use-add-application-note';
import { useDeleteApplicationNote } from '../../query/use-delete-application-note';
import { useUpdateApplicationNote } from '../../query/use-update-application-note';
import { NoteEditor } from '../note-editor';

const iconButton =
  'flex size-[3.2rem] items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-popover hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:hover:bg-accent/40';

/** Add a note, then the notes newest first, each with Edit and Delete. */
export function NotesSection({ applicationId, notes }: { applicationId: string; notes: ApplicationNote[] }) {
  const addNote = useAddApplicationNote(applicationId);
  const updateNote = useUpdateApplicationNote(applicationId);
  const deleteNote = useDeleteApplicationNote(applicationId);
  const [editing, setEditing] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<ApplicationNote | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <NoteEditor
        submitLabel={ADD_NOTE_LABEL}
        onSubmit={(content) =>
          submitWrapper({ fn: async () => ({ id: (await addNote.mutateAsync({ applicationId, content })).id }) })
        }
      />
      {notes.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {notes.map((note) => {
            const date = fullDate(calendarDay(note.createdAt));
            return (
              <li key={note.id} className="flex flex-col gap-1.5 rounded-[1rem] bg-card p-3" data-testid="application-note">
                <div className="flex items-center gap-1">
                  <p className="flex-1 text-xs font-medium text-muted-foreground">{date}</p>
                  {editing === note.id ? null : (
                    <>
                      <button type="button" aria-label={editNoteLabel(date)} className={iconButton} onClick={() => setEditing(note.id)}>
                        <Pencil aria-hidden="true" className="size-[1.4rem]" />
                      </button>
                      <button type="button" aria-label={deleteNoteLabel(date)} className={iconButton} onClick={() => setToDelete(note)}>
                        <Trash2 aria-hidden="true" className="size-[1.4rem]" />
                      </button>
                    </>
                  )}
                </div>
                {editing === note.id ? (
                  <NoteEditor
                    initialHtml={note.content}
                    submitLabel={NOTE_SAVE_LABEL}
                    onCancel={() => setEditing(null)}
                    onSubmit={async (content) => {
                      const ok = await submitWrapper({
                        fn: async () => ({ id: (await updateNote.mutateAsync({ id: note.id, content })).id }),
                      });
                      if (ok) {
                        setEditing(null);
                      }
                      return ok;
                    }}
                  />
                ) : (
                  <NoteContent html={note.content} className="flex flex-col gap-1.5 text-sm leading-[1.5] break-words text-foreground" />
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
      <ConfirmModal
        isOpen={toDelete !== null}
        title={DELETE_NOTE_TITLE}
        description={DELETE_NOTE_DESCRIPTION}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            void submitWrapper({ fn: () => deleteNote.mutateAsync(toDelete.id), successMessage: NOTE_DELETED_MESSAGE });
          }
        }}
      />
    </div>
  );
}
