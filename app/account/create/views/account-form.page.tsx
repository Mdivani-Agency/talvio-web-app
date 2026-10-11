'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ClipboardPasteIcon, UploadIcon } from 'lucide-react';

import { Button } from '@components/ui';
import { ConfirmModal, PasteResumeModal, UploadModal } from '@components/modals';
import { useResumeParser } from '@hooks/use-resume-parser';
import { transformFromParsedToAccount } from '@lib/utils/forms';

import { useSaveProfileFlow } from '../../hooks/use-save-profile-flow';
import { useAccountContext } from '../../providers/state-provider';
import { AccountForm } from './account.form';

export default function AccountFormPage() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const { offerImport, pendingImport, applyImport, cancelImport, submitProfile, formRevision } = useAccountContext();
  const { save, isSaving } = useSaveProfileFlow();

  const { parseResumeText, parsePastedText, loading } = useResumeParser({
    onResumeParsed: (parsedResume, sourceText) => {
      offerImport(transformFromParsedToAccount(parsedResume), sourceText);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleFileUpload = (file: File) => {
    setIsUploadModalOpen(false);
    void parseResumeText(file);
  };

  const handlePaste = (text: string) => {
    setIsPasteModalOpen(false);
    void parsePastedText(text);
  };

  return (
    <section className="container flex flex-col gap-4 mx-auto">
      <h1 className="text-2xl font-bold mt-8">Let&apos;s Build Your Profile!</h1>
      <p className="text-sm font-medium text-muted-foreground">
        Please fill out your details as thoroughly as possible. The more information you provide, the more tailored
        and professional your resume will be. Focus on sharing your key achievements, skills, and experience to make
        your profile stand out!
      </p>
      <div className="flex items-center justify-start gap-3">
        <Button onClick={() => setIsUploadModalOpen(true)} loading={loading}>
          <UploadIcon className="size-4" />
          {loading ? 'Parsing resume...' : 'Import from resume'}
        </Button>
        <Button variant="secondary" onClick={() => setIsPasteModalOpen(true)} disabled={loading}>
          <ClipboardPasteIcon className="size-4" />
          Paste resume text
        </Button>
      </div>
      <AccountForm
        key={formRevision}
        submitLabel={isSaving ? 'Saving...' : 'Save profile'}
        submitting={isSaving}
        onSubmit={(dto) => {
          submitProfile(dto);
          save(dto);
        }}
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
      <ConfirmModal
        isOpen={pendingImport !== null}
        title="Replace current profile?"
        description="Imported resume details will replace the information you have already entered. Cancel to keep your current work."
        onClose={cancelImport}
        onConfirm={applyImport}
      />
    </section>
  );
}
