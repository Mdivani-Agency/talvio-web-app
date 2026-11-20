'use client';

import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { List, ListOrdered } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@components/ui';
import {
  BULLET_LIST_LABEL,
  NOTE_CANCEL_LABEL,
  NOTE_EDITOR_LABEL,
  NOTE_PLACEHOLDER,
  NOTE_TOO_LONG,
  NUMBERED_LIST_LABEL,
} from '@/lib/applications-copy';
import { cn } from '@lib/utils';

/** The database stores at most 5,000 characters of note HTML. */
export const NOTE_MAX_LENGTH = 5000;

type NoteEditorProps = {
  initialHtml?: string;
  submitLabel: string;
  /** Saves the note; resolves true when it was saved, so the editor can clear. */
  onSubmit: (html: string) => Promise<boolean>;
  onCancel?: () => void;
};

/**
 * The note editor: paragraphs, bulleted and numbered lists, nothing else (MDI-657). Typing "- " or "1. " starts a
 * list too. Saved notes are rendered with `NoteContent`, which keeps only these elements.
 */
export function NoteEditor({ initialHtml = '', submitLabel, onSubmit, onCancel }: NoteEditorProps) {
  const [html, setHtml] = useState(initialHtml);
  const [saving, setSaving] = useState(false);
  const editor = useEditor({
    immediatelyRender: false,
    // Editing a note puts the cursor at its end.
    autofocus: initialHtml ? 'end' : false,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        bold: false,
        italic: false,
        strike: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Placeholder.configure({ placeholder: NOTE_PLACEHOLDER }),
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        'aria-label': NOTE_EDITOR_LABEL,
        'aria-multiline': 'true',
        role: 'textbox',
        class:
          'min-h-[8rem] rounded-md border border-input bg-input px-3 py-2.5 text-sm leading-[1.5] text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_ol]:list-decimal [&_ol]:pl-5 [&_p.is-editor-empty:first-child::before]:pointer-events-none [&_p.is-editor-empty:first-child::before]:float-left [&_p.is-editor-empty:first-child::before]:h-0 [&_p.is-editor-empty:first-child::before]:text-placeholder [&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_ul]:list-disc [&_ul]:pl-5',
      },
    },
    onUpdate: ({ editor: current }) => setHtml(current.isEmpty ? '' : current.getHTML()),
  });

  const tooLong = html.length > NOTE_MAX_LENGTH;
  const empty = html.trim() === '';

  const submit = async () => {
    if (!editor || empty || tooLong) {
      return;
    }
    // Read-only while saving, so nothing typed after Add note is lost when the editor clears.
    setSaving(true);
    editor.setEditable(false);
    const saved = await onSubmit(html);
    editor.setEditable(true);
    setSaving(false);
    if (saved && !initialHtml) {
      editor.commands.clearContent(true);
      setHtml('');
    }
  };

  const toolClass = (active: boolean) =>
    cn(
      'flex size-[3.2rem] items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-popover hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:hover:bg-accent/40',
      active && 'bg-popover text-foreground dark:bg-accent/40',
    );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1">
        <button
          type="button"
          aria-label={BULLET_LIST_LABEL}
          aria-pressed={editor?.isActive('bulletList') ?? false}
          className={toolClass(editor?.isActive('bulletList') ?? false)}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List aria-hidden="true" className="size-[1.6rem]" />
        </button>
        <button
          type="button"
          aria-label={NUMBERED_LIST_LABEL}
          aria-pressed={editor?.isActive('orderedList') ?? false}
          className={toolClass(editor?.isActive('orderedList') ?? false)}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered aria-hidden="true" className="size-[1.6rem]" />
        </button>
      </div>
      <EditorContent editor={editor} />
      {tooLong ? (
        <p role="alert" className="text-sm text-foreground">
          {NOTE_TOO_LONG}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" className="h-[4rem] text-sm" onClick={onCancel}>
            {NOTE_CANCEL_LABEL}
          </Button>
        ) : null}
        <Button
          type="button"
          className="h-[4rem] text-sm"
          disabled={empty || tooLong || saving}
          loading={saving}
          onClick={() => void submit()}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
