'use client';

import { ChevronLeft, Cloud, Download, HardDrive, Pencil, Save, SparklesIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button, Logo, ThemeToggle } from '@components/ui';
import { BetaTag } from '@components/views/beta-tag';
import type { SaveStatus } from '@lib/resume/save-queue';
import {
  DOWNLOAD_PDF_LABEL,
  EDITOR_BACK,
  EDITOR_SIGN_IN,
  IMPROVE_WITH_AI_LABEL,
  RESUME_LABEL_FIELD,
  RETRY_SAVE_LABEL,
  SAVE_RESUME_LABEL,
  SAVING_RESUME_LABEL,
  renameResumeLabel,
  saveStatusText,
} from '@/lib/resume-editor-copy';

type EditorTopBarProps = {
  title: string;
  /** The current label; renaming writes it through `onRename`. */
  label: string;
  guest: boolean;
  draft: boolean;
  readOnly: boolean;
  signInHref?: string;
  saveStatus?: SaveStatus;
  saveMessage?: string;
  onRetrySave?: () => void;
  onRename: (label: string) => void;
  onDownload: () => void;
  /** Save to the account without a PDF; the button shows only when this is passed. */
  onSave?: () => void;
  savePending?: boolean;
  onImprove?: () => void;
  improveDisabled?: boolean;
};

/**
 * The editor's own top bar: the logo and back link, the resume name (click to rename), the save state in words,
 * Save resume (a new resume only) and Download PDF. 64px from `md`; 56px on phones, with only back, the title and the
 * Save and Download icons.
 */
export function EditorTopBar({
  title,
  label,
  guest,
  draft,
  readOnly,
  signInHref,
  saveStatus,
  saveMessage,
  onRetrySave,
  onRename,
  onDownload,
  onSave,
  savePending = false,
  onImprove,
  improveDisabled = false,
}: EditorTopBarProps) {
  const [renaming, setRenaming] = useState(false);
  const back = guest ? EDITOR_BACK.guest : EDITOR_BACK.signedIn;
  const retry = onRetrySave && (saveStatus === 'failed' || saveStatus === 'conflict');

  const commit = (value: string) => {
    setRenaming(false);
    if (value.trim() !== label.trim()) {
      onRename(value);
    }
  };

  return (
    <header className="flex h-[5.6rem] flex-none items-center gap-2 border-b border-border bg-background px-2 md:h-[6.4rem] md:gap-3 md:px-6">
      <div className="hidden items-center gap-2 md:flex">
        <Logo size="small" />
        <BetaTag />
        <span aria-hidden="true" className="mx-1 h-7 w-px bg-border" />
      </div>
      <Link
        href={back.href}
        aria-label={back.label}
        className="flex h-[4.4rem] flex-none items-center gap-1 rounded-md px-1 text-sm font-medium text-foreground hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none md:pr-3 md:pl-2"
      >
        <ChevronLeft aria-hidden="true" className="size-5" />
        <span className="hidden md:inline">{back.text}</span>
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        {renaming ? (
          <input
            autoFocus
            aria-label={RESUME_LABEL_FIELD}
            defaultValue={label}
            placeholder={title}
            className="h-8 w-full max-w-[40rem] rounded-md border border-input bg-input px-2 text-md font-semibold text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            onBlur={(event) => commit(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commit(event.currentTarget.value);
              if (event.key === 'Escape') setRenaming(false);
            }}
          />
        ) : readOnly ? (
          <h1 className="truncate text-[1.5rem] font-semibold text-foreground md:text-md">{title}</h1>
        ) : (
          <h1 className="min-w-0">
            <button
              type="button"
              aria-label={renameResumeLabel(title)}
              onClick={() => setRenaming(true)}
              className="flex max-w-full items-center gap-1.5 rounded-sm text-left text-[1.5rem] font-semibold text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none md:text-md"
            >
              <span className="truncate">{title}</span>
              <Pencil aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
            </button>
          </h1>
        )}
        {saveStatus ? (
          <p role="status" className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground" data-allow-small-text>
            {saveStatus === 'saved-locally' ? (
              <HardDrive aria-hidden="true" className="size-3.5 shrink-0" />
            ) : (
              <Cloud aria-hidden="true" className="size-3.5 shrink-0" />
            )}
            <span className="truncate">{saveStatusText(saveStatus, { guest, draft })}</span>
            {saveMessage ? <span className="hidden truncate md:inline">{saveMessage}</span> : null}
            {retry ? (
              <Button type="button" variant="link" size="sm" className="h-auto px-0 text-xs" onClick={onRetrySave}>
                {RETRY_SAVE_LABEL}
              </Button>
            ) : null}
          </p>
        ) : null}
      </div>
      <div className="hidden items-center gap-2 md:flex">
        {guest && signInHref ? (
          <Link
            href={signInHref}
            className="flex h-[4.4rem] items-center rounded-md px-3 text-sm font-medium text-foreground hover:bg-accent"
          >
            {EDITOR_SIGN_IN}
          </Link>
        ) : null}
        <ThemeToggle />
        {onImprove ? (
          <Button type="button" variant="outline" className="h-[4.4rem] px-4" onClick={onImprove} disabled={improveDisabled}>
            <SparklesIcon aria-hidden="true" className="size-4" />
            {IMPROVE_WITH_AI_LABEL}
          </Button>
        ) : null}
      </div>
      {onSave ? (
        <Button
          type="button"
          variant="outline"
          aria-label={SAVE_RESUME_LABEL}
          onClick={onSave}
          disabled={savePending}
          className="h-[4.4rem] min-w-[4.4rem] flex-none px-0 font-semibold md:px-4"
        >
          <Save aria-hidden="true" className="size-4" />
          <span className="hidden md:inline">{savePending ? SAVING_RESUME_LABEL : SAVE_RESUME_LABEL}</span>
        </Button>
      ) : null}
      <Button
        type="button"
        aria-label={DOWNLOAD_PDF_LABEL}
        onClick={onDownload}
        className="h-[4.4rem] min-w-[4.4rem] flex-none px-0 font-semibold md:px-4"
      >
        <Download aria-hidden="true" className="size-4" />
        <span className="hidden md:inline">{DOWNLOAD_PDF_LABEL}</span>
      </Button>
    </header>
  );
}
