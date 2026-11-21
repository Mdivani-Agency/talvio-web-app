'use client';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@components/ui';
import { ADD_DIALOG_DESCRIPTION, ADD_DIALOG_TITLE } from '@/lib/applications-copy';
import type { AddApplicationFormValues } from '@lib/schema/application.schema';
import type { ApplicationStage } from '@lib/types';

import { useResumeOptions } from '../query/use-resume-options';
import { AddApplicationForm } from './add-application.form';

type AddApplicationDialogProps = {
  open: boolean;
  defaults?: Partial<AddApplicationFormValues>;
  onAdded?: (id: string) => void;
  userId: string;
  onOpenChange: (open: boolean) => void;
  onCreate: (values: AddApplicationFormValues, stage: ApplicationStage) => Promise<{ id: string }>;
};

/** "Add an application". The resume picker lists every resume the user has, loaded when the dialog opens. */
export function AddApplicationDialog({ open, userId, defaults, onAdded, onOpenChange, onCreate }: AddApplicationDialogProps) {
  const resumesQuery = useResumeOptions(userId, open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-auto bottom-0 max-h-[100svh] translate-y-0 gap-4 overflow-y-auto rounded-b-none p-6 sm:top-[50%] sm:bottom-auto sm:max-w-[52rem] sm:translate-y-[-50%] sm:rounded-b-lg">
        <DialogTitle className="pr-8 text-[2rem] font-semibold text-primary">{ADD_DIALOG_TITLE}</DialogTitle>
        <DialogDescription className="sr-only">{ADD_DIALOG_DESCRIPTION}</DialogDescription>
        {open ? (
          <AddApplicationForm
            defaults={defaults}
            onAdded={onAdded}
            resumes={resumesQuery.data ?? []}
            resumesLoading={resumesQuery.isLoading}
            resumesFailed={resumesQuery.isError}
            onRetryResumes={() => void resumesQuery.refetch()}
            onCreate={onCreate}
            onDone={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
