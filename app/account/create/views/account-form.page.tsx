'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { UploadIcon } from 'lucide-react';

import { Button } from '@components/ui';
import { ConfirmModal, UploadModal } from '@components/modals';
import { useResumeParser } from '@hooks/use-resume-parser';
import { transformFromParsedToAccount } from '@lib/utils/forms';

import { useAccountContext } from '../../providers/state-provider';
import { AccountForm } from './account.form';

export default function AccountFormPage() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { offerImport, pendingImport, applyImport, cancelImport, submitProfile, formRevision } = useAccountContext();

  const { parseResumeText, loading } = useResumeParser({
    onResumeParsed: (parsedResume) => {
      offerImport(transformFromParsedToAccount(parsedResume));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleFileUpload = (file: File) => {
    setIsUploadModalOpen(false);
    void parseResumeText(file);
  };

  return (
    <section className="container flex flex-col gap-4 mx-auto">
      <h1 className="text-2xl font-bold mt-8">Let&apos;s Build Your Profile!</h1>
      <p className="text-sm font-medium text-muted-foreground">
        Please fill out your details as thoroughly as possible. The more information you provide, the more tailored
        and professional your resume will be. Don&apos;t worry about perfect wording or grammar—our AI will
        automatically review and polish the formatting at the end. Focus on sharing your key achievements, skills, and
        experience to make your profile stand out!
      </p>
      <div className="flex items-center justify-start gap-3">
        <Button onClick={() => setIsUploadModalOpen(true)} loading={loading}>
          <UploadIcon className="size-4" />
          {loading ? 'Parsing resume...' : 'Import from resume'}
        </Button>
      </div>
      <AccountForm key={formRevision} onSubmit={submitProfile} />
      <UploadModal
        title="Upload Resume"
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onFileUpload={handleFileUpload}
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
