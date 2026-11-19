'use client';
import { useCallback } from 'react';
import { Education } from '@lib/types';
import { ENTRY_LISTS, PROFILE_SECTIONS } from '@/lib/onboarding-copy';

import { SectionHeading } from './forms/section-heading';
import { EducationForm } from './forms/education.form';
import { EntryList } from './entry-list';
import { educationSummary } from './entry-summaries';
import type { AppForm } from '@lib/forms/use-form';
import { useFormArray } from '@lib/forms/use-form-array';
import { preserveDocumentFields, resumeItemToAccountDialog } from '@lib/models/resume-document';

type EducationViewProps = {
  className?: string;
  form: AppForm;
  /** Convert account-shaped dialogs into resume document items. */
  documentMode?: boolean;
  /** Off where a parent already names the section, as the resume editor's accordion does. */
  heading?: boolean;
};

export const EducationView = ({ className, form, documentMode = false, heading = true }: EducationViewProps) => {
  const { fields, append, remove, update, replace } = useFormArray<Education>(form, 'education');

  const handleAdd = useCallback(
    (item: Education) => {
      append(documentMode ? preserveDocumentFields(undefined, item) : item);
    },
    [append, documentMode],
  );

  const handleUpdate = useCallback(
    (index: number, item: Education) => {
      update(index, documentMode ? preserveDocumentFields(fields[index], item) : item);
    },
    [documentMode, fields, update],
  );

  return (
    <section className={className}>
      {heading ? (
        <div className="mb-6">
          <SectionHeading copy={PROFILE_SECTIONS.education} />
        </div>
      ) : null}
      <EntryList
        items={fields}
        copy={ENTRY_LISTS.education}
        summarize={educationSummary}
        renderForm={({ defaultValues, submitLabel, onSubmit, onCancel }) => (
          <EducationForm
            submitLabel={submitLabel}
            onCancel={onCancel}
            onSubmit={(value) => onSubmit(value as (typeof fields)[number])}
            defaultValues={defaultValues ? (documentMode ? resumeItemToAccountDialog(defaultValues) : defaultValues) : undefined}
          />
        )}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onRemove={remove}
        onReorder={replace}
      />
    </section>
  );
};
