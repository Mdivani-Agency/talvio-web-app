'use client';

import { CircleAlert, FileText, FileUp, TriangleAlert } from 'lucide-react';
import { useId, useRef, useState } from 'react';

import { Button, Textarea } from '@components/ui';
import { Modal } from '@components/views';
import { cn } from '@lib/utils';
import {
  IMPORT_DIALOG,
  MAX_PASTED_RESUME_CHARS,
  notPdfMessage,
  pasteCountText,
} from '@/lib/onboarding-copy';

export type ImportTab = 'upload' | 'paste';

export type ImportResumeDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Runs when the person confirms a PDF. The caller closes the dialog and shows the page lock. */
  onImportFile: (file: File) => void;
  /** Runs when the person confirms pasted text (trimmed, within `MAX_PASTED_RESUME_CHARS`). */
  onImportText: (text: string) => void;
  /** When set, the import replaces details already entered: this line explains what, and Import says so. */
  replaceWarning?: string | null;
  /** The tab to open on, such as Paste text after a PDF could not be read. */
  initialTab?: ImportTab;
  title?: string;
  description?: string;
};

function isPdf(file: File) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

/**
 * "Import your resume" (MDI-674): one dialog with Upload a PDF and Paste text. Nothing starts until the person
 * confirms a file or text; a file that is not a PDF and text over the limit are explained here, next to the input.
 * A bottom sheet on phones (`Modal`). Mount it with a new `key` to start empty each time it opens.
 */
export function ImportResumeDialog({
  open,
  onClose,
  onImportFile,
  onImportText,
  replaceWarning = null,
  initialTab = 'upload',
  title = IMPORT_DIALOG.title,
  description = IMPORT_DIALOG.description,
}: ImportResumeDialogProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<ImportTab>(initialTab);
  const [file, setFile] = useState<File | null>(null);
  const [rejected, setRejected] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [text, setText] = useState('');

  const over = text.length > MAX_PASTED_RESUME_CHARS;
  const ready = tab === 'upload' ? file !== null : text.trim().length > 0 && !over;

  const take = (picked: File | undefined) => {
    if (!picked) {
      return;
    }
    if (!isPdf(picked)) {
      setFile(null);
      setRejected(notPdfMessage(picked.name));
      return;
    }
    setRejected(null);
    setFile(picked);
  };

  const confirm = () => {
    if (!ready) {
      return;
    }
    if (tab === 'upload' && file) {
      onImportFile(file);
      return;
    }
    onImportText(text.trim());
  };

  const tabClass = (selected: boolean) =>
    cn(
      'h-[4rem] rounded-md text-sm focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
      selected ? 'bg-background font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.1)]' : 'font-medium',
    );

  return (
    <Modal open={open} onOpenChange={(next) => (next ? undefined : onClose())} title={title} description={description} className="w-full max-w-[52rem]">
      <div className="flex flex-col gap-4 text-left">
        <div role="tablist" aria-label={IMPORT_DIALOG.tabsLabel} className="grid grid-cols-2 gap-1 rounded-[1rem] bg-card p-1">
          <button
            type="button"
            role="tab"
            id={`${id}-upload-tab`}
            aria-selected={tab === 'upload'}
            aria-controls={`${id}-panel`}
            className={tabClass(tab === 'upload')}
            onClick={() => setTab('upload')}
          >
            {IMPORT_DIALOG.uploadTab}
          </button>
          <button
            type="button"
            role="tab"
            id={`${id}-paste-tab`}
            aria-selected={tab === 'paste'}
            aria-controls={`${id}-panel`}
            className={tabClass(tab === 'paste')}
            onClick={() => setTab('paste')}
          >
            {IMPORT_DIALOG.pasteTab}
          </button>
        </div>

        <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${tab}-tab`} className="flex flex-col gap-3">
          {tab === 'upload' ? (
            <>
              <input
                ref={inputRef}
                data-testid="file-input"
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(event) => {
                  take(event.target.files?.[0]);
                  event.target.value = '';
                }}
              />
              {file ? (
                <div className="flex items-center gap-3 rounded-[1.2rem] border border-input px-4 py-3.5">
                  <span className="flex size-10 flex-none items-center justify-center rounded-md bg-popover text-secondary">
                    <FileText aria-hidden className="size-5" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold">{file.name}</span>
                    <span className="text-sm text-muted-foreground">{IMPORT_DIALOG.ready}</span>
                  </span>
                  <Button type="button" variant="link" className="h-[4rem] px-3 underline" onClick={() => setFile(null)}>
                    {IMPORT_DIALOG.remove}
                  </Button>
                </div>
              ) : (
                <div
                  data-testid="import-drop-zone"
                  data-dragging={dragging || undefined}
                  className={cn(
                    'flex min-h-[20rem] flex-col items-center justify-center gap-2.5 rounded-[1.2rem] border-2 border-dashed bg-card p-5 text-center md:min-h-[22rem]',
                    rejected ? 'border-destructive' : dragging ? 'border-secondary' : 'border-input',
                  )}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    take(event.dataTransfer.files?.[0]);
                  }}
                >
                  <span className="flex size-12 items-center justify-center rounded-full bg-background text-secondary">
                    <FileUp aria-hidden className="size-6" />
                  </span>
                  <span className="text-[1.5rem] font-semibold">
                    <span className="hidden md:inline">{IMPORT_DIALOG.dropTitle}</span>
                    <span className="md:hidden">{IMPORT_DIALOG.dropTitlePhone}</span>
                  </span>
                  <span className="text-sm text-muted-foreground">{IMPORT_DIALOG.dropHint}</span>
                  <Button type="button" variant="outline" className="h-[4.4rem]" onClick={() => inputRef.current?.click()}>
                    {IMPORT_DIALOG.choose}
                  </Button>
                </div>
              )}
              {rejected ? (
                <p role="alert" className="m-0 flex gap-2 text-sm text-destructive">
                  <CircleAlert aria-hidden className="mt-0.5 size-4 flex-none" />
                  <span>{rejected}</span>
                </p>
              ) : null}
            </>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${id}-text`} className="text-sm font-medium">
                {IMPORT_DIALOG.pasteLabel}
              </label>
              <Textarea
                id={`${id}-text`}
                aria-invalid={over}
                aria-describedby={`${id}-count`}
                placeholder={IMPORT_DIALOG.pastePlaceholder}
                className={cn('h-64 font-normal', over && 'border-destructive')}
                value={text}
                onChange={(event) => setText(event.target.value)}
              />
              <span
                id={`${id}-count`}
                aria-live="polite"
                className={cn('text-sm font-normal text-muted-foreground', over && 'text-destructive')}
              >
                {pasteCountText(text.length)}
              </span>
            </div>
          )}
        </div>

        {replaceWarning ? (
          <p data-testid="import-replace-warning" className="m-0 flex gap-2.5 rounded-[1rem] bg-card px-3.5 py-3 text-sm leading-normal">
            <TriangleAlert aria-hidden className="mt-0.5 size-[1.8rem] flex-none text-secondary" />
            <span>
              <strong className="font-semibold">{IMPORT_DIALOG.replaceTitle}</strong> {replaceWarning}
            </span>
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="h-[4.4rem]" onClick={onClose}>
            {IMPORT_DIALOG.cancel}
          </Button>
          <Button type="button" className="h-[4.4rem] px-6" disabled={!ready} onClick={confirm}>
            {replaceWarning ? IMPORT_DIALOG.replaceAndImport : IMPORT_DIALOG.import}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
