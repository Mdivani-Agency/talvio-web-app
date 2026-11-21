'use client';

import { useState, type ReactNode } from 'react';

import { ImportResumeDialog, type ImportTab } from '@components/import/import-resume-dialog';
import { ImportReviewPanel } from '@components/import/import-review-panel';
import { Button } from '@components/ui';
import { PageLock } from '@components/views';
import { useResumeParser } from '@hooks/use-resume-parser';
import type { ImportReview } from '@lib/llm/parse-document';
import { profileToResumeDocument } from '@lib/models/resume-document';
import type { AccountDto, PreviewDto } from '@lib/types';
import { IMPORT_LOCK, IMPORT_REVIEW } from '@/lib/onboarding-copy';
import { EDITOR_IMPORT, RESUME_SECTIONS, type ResumeSectionId } from '@/lib/resume-editor-copy';

/** Where an import's check item belongs in the editor. "Profile" covers the person, contacts and location. */
export function editorSectionForImportReview(label: string): ResumeSectionId | null {
  switch (label) {
    case 'Profile':
      return 'about';
    case 'Experience':
      return 'experience';
    case 'Education':
      return 'education';
    case 'Projects':
      return 'projects';
    case 'Recommendations':
      return 'recommendations';
    case 'Skills':
    case 'Tools':
    case 'Links':
    case 'Languages':
      return 'highlights';
    default:
      return null;
  }
}

/** The imported profile as this resume's content and name; template, colour and text size stay as they are. */
export function importedResumeContent(account: AccountDto): Pick<PreviewDto, 'resume' | 'name'> {
  const name = `${account.profile.firstName} ${account.profile.lastName}`.trim() || 'my resume';
  return { resume: profileToResumeDocument(account), name };
}

type Source = { kind: 'pdf'; name: string } | { kind: 'paste' };

/**
 * Import in the editor (MDI-675): the shared "Import a resume" dialog, the page lock while it reads, and a "what to
 * check" panel docked over the form until Done checking (the editor autosaves, so there is no Save to wait for).
 * The result replaces this resume's sections; the profile is not touched.
 */
export function useEditorImport({
  onApply,
  onOpenSection,
}: {
  onApply: (content: Pick<PreviewDto, 'resume' | 'name'>) => void;
  onOpenSection: (id: ResumeSectionId) => void;
}): { open: () => void; ui: ReactNode } {
  const [dialog, setDialog] = useState<{ key: number; tab: ImportTab } | null>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [checked, setChecked] = useState<{ review: ImportReview; source: string } | null>(null);

  const parser = useResumeParser({
    onResumeParsed: (account, _sourceText, review) => {
      onApply(importedResumeContent(account));
      setChecked({ review, source: source?.kind === 'pdf' ? source.name : IMPORT_REVIEW.pastedSource });
    },
    onError: (error) => setFailure(error.message),
  }, { surface: 'resume' });

  const open = (tab: ImportTab = 'upload') => setDialog({ key: Date.now(), tab });
  const start = (next: Source) => {
    setDialog(null);
    setFailure(null);
    setChecked(null);
    setSource(next);
  };

  const ui = (
    <>
      {dialog ? (
        <ImportResumeDialog
          key={dialog.key}
          open
          initialTab={dialog.tab}
          title={EDITOR_IMPORT.title}
          description={EDITOR_IMPORT.description}
          replaceTitle={EDITOR_IMPORT.replaceTitle}
          replaceWarning={EDITOR_IMPORT.replaceWarning}
          onClose={() => setDialog(null)}
          onImportFile={(file) => {
            start({ kind: 'pdf', name: file.name });
            void parser.parseResumeText(file);
          }}
          onImportText={(text) => {
            start({ kind: 'paste' });
            void parser.parsePastedText(text);
          }}
        />
      ) : null}
      {parser.loading || failure !== null ? (
        <PageLock
          context={IMPORT_LOCK.context}
          title={IMPORT_LOCK.title}
          steps={source?.kind === 'paste' ? EDITOR_IMPORT.pastedSteps : EDITOR_IMPORT.steps}
          currentStep={parser.stage === 'reading' ? 0 : 1}
          note={EDITOR_IMPORT.note}
          slowNote={IMPORT_LOCK.slow}
          offlineNote={IMPORT_LOCK.offline}
          cancel={{ label: IMPORT_LOCK.stop, onClick: parser.stop }}
          failure={failure !== null ? {
            title: IMPORT_LOCK.failure.title,
            body: failure,
            kept: EDITOR_IMPORT.failureKept,
            primary: {
              label: IMPORT_LOCK.failure.primary,
              onClick: () => {
                parser.dismiss();
                setFailure(null);
                open('paste');
              },
            },
            secondary: {
              label: EDITOR_IMPORT.failureBack,
              onClick: () => {
                parser.dismiss();
                setFailure(null);
              },
            },
          } : undefined}
        />
      ) : null}
      {checked ? (
        <div
          data-testid="editor-import-check"
          className="fixed inset-x-0 bottom-0 z-40 max-h-[70dvh] overflow-y-auto rounded-t-[1.6rem] bg-background p-3 shadow-[0_-8px_32px_rgba(13,13,13,0.16)] md:inset-x-auto md:bottom-6 md:left-6 md:w-[min(44rem,calc(100vw-4.8rem))] md:rounded-[1.6rem] md:shadow-[0_16px_48px_rgba(13,13,13,0.18)]"
        >
          <ImportReviewPanel
            review={checked.review}
            source={checked.source}
            targetFor={(section) => {
              const id = editorSectionForImportReview(section);
              const title = RESUME_SECTIONS.find((item) => item.id === id)?.title;
              return id && title ? { href: `#${id}`, label: title, onSelect: () => onOpenSection(id) } : null;
            }}
          />
          <div className="mt-3 flex justify-end">
            <Button type="button" className="h-[4.4rem] w-full md:w-auto" onClick={() => setChecked(null)}>
              {EDITOR_IMPORT.doneChecking}
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );

  return { open, ui };
}
