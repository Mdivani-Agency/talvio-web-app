'use client';

import { UploadIcon } from 'lucide-react';
import { useState } from 'react';

import { ImportResumeDialog, type ImportTab } from '@components/import/import-resume-dialog';
import { ImportReviewPanel } from '@components/import/import-review-panel';
import { Button } from '@components/ui';
import { PageContainer, PageLock } from '@components/views';
import { useResumeParser } from '@hooks/use-resume-parser';
import { shouldConfirmImport } from '@lib/drafts';
import type { ImportReview } from '@lib/llm/parse-document';
import type { AccountDto } from '@lib/types';
import {
  IMPORT_LOCK,
  IMPORT_REVIEW,
  ONBOARDING_HEADING,
  ONBOARDING_INTRO,
  PROFILE_SECTIONS,
  SAVE_PROFILE_LABEL,
  SAVING_PROFILE_LABEL,
  START_FASTER,
  replaceWarningBody,
  startFasterImportedBody,
} from '@/lib/onboarding-copy';
import { SAVE_PROFILE_LOCK } from '@/lib/page-lock-copy';

import { useSaveProfileFlow } from '../../hooks/use-save-profile-flow';
import { useAccountContext } from '../../providers/state-provider';
import { AccountForm } from './account.form';
import { sectionForImportReview, sectionStatuses, type ProfileSectionId } from './profile-sections';

/** What is being imported: a PDF by name, or pasted text. Unknown for a job restored after a reload. */
type ImportSource = { kind: 'pdf'; name: string } | { kind: 'paste' };

function sourceLabel(source: ImportSource | null): string {
  return source?.kind === 'pdf' ? source.name : IMPORT_REVIEW.pastedSource;
}

/**
 * Onboarding (`/account/create`). Import (MDI-674) goes through one dialog; the import then runs on the page lock,
 * fills the form with no confirm after it (the dialog warned first when details were entered), and leaves a panel of
 * what to check until Save profile, which runs on the page lock too (MDI-670).
 */
export default function AccountFormPage() {
  const { applyImport, submitProfile, formRevision, partialDto, accountDto } = useAccountContext();
  const { save, isSaving, locked } = useSaveProfileFlow();
  const [dialog, setDialog] = useState<{ key: number; tab: ImportTab } | null>(null);
  const [source, setSource] = useState<ImportSource | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [checked, setChecked] = useState<{ review: ImportReview; source: string } | null>(null);

  const parser = useResumeParser({
    onResumeParsed: (account, sourceText, review) => {
      applyImport(account, sourceText);
      setChecked({ review, source: sourceLabel(source) });
    },
    onError: (error) => {
      setFailure(error.message);
    },
  }, { surface: 'onboarding' });

  const current = partialDto ?? accountDto;
  const replaceWarning = shouldConfirmImport(current)
    ? replaceWarningBody(
      sectionStatuses((current ?? {}) as Partial<AccountDto>, [])
        .filter((section) => section.state === 'done')
        .map((section) => section.title),
    )
    : null;

  const openDialog = (tab: ImportTab = 'upload') => setDialog({ key: Date.now(), tab });
  const closeDialog = () => setDialog(null);

  const importFile = (file: File) => {
    closeDialog();
    setFailure(null);
    setSource({ kind: 'pdf', name: file.name });
    void parser.parseResumeText(file);
  };

  const importText = (text: string) => {
    closeDialog();
    setFailure(null);
    setSource({ kind: 'paste' });
    void parser.parsePastedText(text);
  };

  const checkSections = [
    ...new Set(
      (checked?.review.items ?? [])
        .map((item) => sectionForImportReview(item.section))
        .filter((id): id is ProfileSectionId => id !== null),
    ),
  ];

  const showImportLock = parser.loading || failure !== null;

  return (
    <PageContainer as="section" className="flex flex-col gap-6 pt-8 pb-10 lg:pt-10">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[2.4rem] leading-[1.333] font-semibold text-primary md:text-[2.8rem]">{ONBOARDING_HEADING}</h1>
        <p className="max-w-[64rem] text-md text-muted-foreground">{ONBOARDING_INTRO}</p>
      </div>
      <AccountForm
        key={formRevision}
        submitLabel={isSaving ? SAVING_PROFILE_LABEL : SAVE_PROFILE_LABEL}
        submitting={isSaving}
        onSubmit={(dto) => {
          submitProfile(dto);
          save(dto);
        }}
        checkSections={checkSections}
        importReview={
          checked ? (
            <ImportReviewPanel
              review={checked.review}
              source={checked.source}
              targetFor={(section) => {
                const id = sectionForImportReview(section);
                return id ? { href: `#${id}`, label: PROFILE_SECTIONS[id].title } : null;
              }}
            />
          ) : null
        }
        startFaster={
          <section aria-labelledby="start-faster-title" className="flex flex-col gap-3 rounded-[1.2rem] bg-card p-4 lg:p-5">
            <h2 id="start-faster-title" className="text-md font-semibold text-primary">
              {START_FASTER.title}
            </h2>
            <p className="text-sm leading-[1.4286] text-muted-foreground">
              {checked ? startFasterImportedBody(checked.source) : START_FASTER.body}
            </p>
            <Button
              className="h-[4.4rem]"
              variant={checked ? 'outline' : 'default'}
              onClick={() => openDialog()}
              disabled={parser.loading}
            >
              <UploadIcon aria-hidden="true" className="size-4" />
              {checked ? START_FASTER.againLabel : START_FASTER.importLabel}
            </Button>
          </section>
        }
      />
      {dialog ? (
        <ImportResumeDialog
          key={dialog.key}
          open
          initialTab={dialog.tab}
          replaceWarning={replaceWarning}
          onClose={closeDialog}
          onImportFile={importFile}
          onImportText={importText}
        />
      ) : null}
      {showImportLock ? (
        <PageLock
          context={IMPORT_LOCK.context}
          title={IMPORT_LOCK.title}
          steps={source?.kind === 'paste' ? IMPORT_LOCK.pastedSteps : IMPORT_LOCK.steps}
          currentStep={parser.stage === 'reading' ? 0 : 1}
          note={IMPORT_LOCK.note}
          slowNote={IMPORT_LOCK.slow}
          offlineNote={IMPORT_LOCK.offline}
          cancel={{ label: IMPORT_LOCK.stop, onClick: parser.stop }}
          failure={failure !== null ? {
            title: IMPORT_LOCK.failure.title,
            body: failure,
            kept: IMPORT_LOCK.failure.kept,
            primary: {
              label: IMPORT_LOCK.failure.primary,
              onClick: () => {
                setFailure(null);
                openDialog('paste');
              },
            },
            secondary: { label: IMPORT_LOCK.failure.secondary, onClick: () => setFailure(null) },
          } : undefined}
        />
      ) : null}
      {locked ? (
        <PageLock
          context={SAVE_PROFILE_LOCK.context}
          title={SAVE_PROFILE_LOCK.title}
          line={SAVE_PROFILE_LOCK.line}
          note={SAVE_PROFILE_LOCK.note}
          slowNote={SAVE_PROFILE_LOCK.slow}
          warnOnLeave
        />
      ) : null}
    </PageContainer>
  );
}
