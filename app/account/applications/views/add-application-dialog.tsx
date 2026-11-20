'use client';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@components/ui';
import { fetchAllResumes } from '@app/resume/query/use-resumes';
import { ADD_DIALOG_DESCRIPTION, ADD_DIALOG_TITLE } from '@/lib/applications-copy';
import { useGraphqlQuery } from '@/lib/query/base-query';
import type { AddApplicationFormValues } from '@lib/schema/application.schema';
import type { ApplicationStage } from '@lib/types';

import { AddApplicationForm } from './add-application.form';

type AddApplicationDialogProps = {
  open: boolean;
  userId: string;
  onOpenChange: (open: boolean) => void;
  onCreate: (values: AddApplicationFormValues, stage: ApplicationStage) => Promise<{ id: string }>;
};

/** "Add an application". The resume picker lists every resume the user has, loaded when the dialog opens. */
export function AddApplicationDialog({ open, userId, onOpenChange, onCreate }: AddApplicationDialogProps) {
  const resumesQuery = useGraphqlQuery(
    ['resumes', userId, 'application-picker'],
    async () => {
      const [general, tailored] = await Promise.all([
        fetchAllResumes(userId, 'GENERAL'),
        fetchAllResumes(userId, 'JOB_SPECIFIC'),
      ]);
      return [...general, ...tailored];
    },
    { enabled: open },
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-auto bottom-0 max-h-[100svh] translate-y-0 gap-4 overflow-y-auto rounded-b-none p-6 sm:top-[50%] sm:bottom-auto sm:max-w-[52rem] sm:translate-y-[-50%] sm:rounded-b-lg">
        <DialogTitle className="pr-8 text-[2rem] font-semibold text-primary">{ADD_DIALOG_TITLE}</DialogTitle>
        <DialogDescription className="sr-only">{ADD_DIALOG_DESCRIPTION}</DialogDescription>
        {open ? (
          <AddApplicationForm
            resumes={resumesQuery.data ?? []}
            resumesLoading={resumesQuery.isLoading}
            onCreate={onCreate}
            onDone={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
