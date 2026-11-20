'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { submitWrapper } from '@app/actions/action.utils';
import { Button } from '@components/ui';
import { ADD_CANCEL_LABEL, ADD_SUBMIT_LABEL, APPLICATION_ADDED_MESSAGE } from '@/lib/applications-copy';
import { firstFormError } from '@lib/forms/errors';
import { useAppForm } from '@lib/forms/use-form';
import { addApplicationFormSchema, type AddApplicationFormValues } from '@lib/schema/application.schema';
import type { ApplicationStage, Resume } from '@lib/types';

import { AddApplicationFields } from './add-application.fields';

export const ADD_APPLICATION_DEFAULTS: AddApplicationFormValues = {
  position: '',
  company: '',
  jobPostUrl: '',
  stage: 'saved',
  appliedOn: '',
  resumeId: '',
};

type AddApplicationFormProps = {
  /** Pre-filled values, such as the resume and stage when the form opens from "Add to tracker". */
  defaults?: Partial<AddApplicationFormValues>;
  /** Called with the new card's id once it is saved; replaces the default success toast when given. */
  onAdded?: (id: string) => void;
  resumes: Resume[];
  resumesLoading: boolean;
  resumesFailed?: boolean;
  onRetryResumes?: () => void;
  /** Saves the card; resolves with its id for `submitWrapper`. */
  onCreate: (values: AddApplicationFormValues, stage: ApplicationStage) => Promise<{ id: string }>;
  onDone: () => void;
  onCancel: () => void;
};

export function AddApplicationForm({
  defaults,
  onAdded,
  resumes,
  resumesLoading,
  resumesFailed,
  onRetryResumes,
  onCreate,
  onDone,
  onCancel,
}: AddApplicationFormProps) {
  const form = useAppForm<AddApplicationFormValues>({
    defaultValues: { ...ADD_APPLICATION_DEFAULTS, ...defaults },
    schema: addApplicationFormSchema,
  });
  const [isSubmitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    await form.validateAllFields('submit');
    await form.validate('submit');
    if (!form.state.isValid) {
      toast.error(firstFormError(form));
      return;
    }
    const values = form.state.values as AddApplicationFormValues;
    setSubmitting(true);
    await submitWrapper({
      fn: () => onCreate(values, values.stage as ApplicationStage),
      successMessage: onAdded ? undefined : APPLICATION_ADDED_MESSAGE,
      onSuccess: (result) => {
        form.reset(ADD_APPLICATION_DEFAULTS);
        onAdded?.(result.id);
        onDone();
      },
    });
    setSubmitting(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <AddApplicationFields
        form={form}
        resumes={resumes}
        resumesLoading={resumesLoading}
        resumesFailed={resumesFailed}
        onRetryResumes={onRetryResumes}
      />
      <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="h-[4.4rem] text-sm" onClick={onCancel}>
          {ADD_CANCEL_LABEL}
        </Button>
        <Button
          type="button"
          className="h-[4.4rem] text-sm"
          loading={isSubmitting}
          disabled={isSubmitting}
          onClick={() => void handleAdd()}
        >
          {ADD_SUBMIT_LABEL}
        </Button>
      </div>
    </div>
  );
}
