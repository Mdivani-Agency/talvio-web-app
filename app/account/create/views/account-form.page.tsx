'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ClipboardPasteIcon, UploadIcon } from 'lucide-react';

import { Button } from '@components/ui';
import { ConfirmModal, PasteResumeModal, UploadModal } from '@components/modals';
import { PageContainer, PageLock } from '@components/views';
import { useResumeParser } from '@hooks/use-resume-parser';
import { toastImportReview } from '@components/import/import-review';
import {
  ONBOARDING_HEADING,
  ONBOARDING_INTRO,
  SAVE_PROFILE_LABEL,
  SAVING_PROFILE_LABEL,
  START_FASTER,
} from '@/lib/onboarding-copy';
import { SAVE_PROFILE_LOCK } from '@/lib/page-lock-copy';

import { useSaveProfileFlow } from '../../hooks/use-save-profile-flow';
import { useAccountContext } from '../../providers/state-provider';
import { AccountForm } from './account.form';

export default function AccountFormPage() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const { offerImport, pendingImport, applyImport, cancelImport, submitProfile, formRevision } = useAccountContext();
  const { save, isSaving, locked } = useSaveProfileFlow();

  const { parseResumeText, parsePastedText, loading, offline } = useResumeParser({
    onResumeParsed: (account, sourceText, review) => {
      offerImport(account, sourceText);
      toastImportReview(review);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  }, { surface: 'onboarding' });

  const handleFileUpload = (file: File) => {
    setIsUploadModalOpen(false);
    void parseResumeText(file);
  };

  const handlePaste = (text: string) => {
    setIsPasteModalOpen(false);
    void parsePastedText(text);
  };

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
        startFaster={
          <section aria-labelledby="start-faster-title" className="flex flex-col gap-3 rounded-[1.2rem] bg-card p-4 lg:p-5">
            <h2 id="start-faster-title" className="text-md font-semibold text-primary">
              {START_FASTER.title}
            </h2>
            <p className="text-sm leading-[1.4286] text-muted-foreground">{START_FASTER.body}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <Button className="h-[4.4rem]" onClick={() => setIsUploadModalOpen(true)} loading={loading}>
                <UploadIcon aria-hidden="true" className="size-4" />
                {loading ? (offline ? 'Waiting for a connection...' : 'Parsing resume...') : START_FASTER.importLabel}
              </Button>
              <Button
                className="h-[4.4rem]"
                variant="outline"
                onClick={() => setIsPasteModalOpen(true)}
                disabled={loading}
              >
                <ClipboardPasteIcon aria-hidden="true" className="size-4" />
                {START_FASTER.pasteLabel}
              </Button>
            </div>
          </section>
        }
      />
      <UploadModal
        title="Upload Resume"
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onFileUpload={handleFileUpload}
      />
      <PasteResumeModal
        isOpen={isPasteModalOpen}
        onClose={() => setIsPasteModalOpen(false)}
        onConfirm={handlePaste}
      />
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
      <ConfirmModal
        isOpen={pendingImport !== null}
        title="Replace current profile?"
        description="Imported resume details will replace the information you have already entered. Cancel to keep your current work."
        onClose={cancelImport}
        onConfirm={applyImport}
      />
    </PageContainer>
  );
}
