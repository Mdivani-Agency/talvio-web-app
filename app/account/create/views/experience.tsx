'use client';
import { useCallback } from 'react';
import { Experience } from '@lib/types';
import { ENTRY_LISTS, PROFILE_SECTIONS } from '@/lib/onboarding-copy';

import { SectionHeading } from './forms/section-heading';
import { ExperienceForm } from './forms/experience.form';
import { EntryList } from './entry-list';
import { experienceSummary } from './entry-summaries';
import type { AppForm } from '@lib/forms/use-form';
import { useFormArray } from '@lib/forms/use-form-array';
import { preserveDocumentFields, resumeItemToAccountDialog } from '@lib/models/resume-document';

type ExperienceViewProps = {
  className?: string;
  form: AppForm;
  /** Convert account-shaped dialogs into resume document items. */
  documentMode?: boolean;
  /** Off where a parent already names the section, as the resume editor's accordion does. */
  heading?: boolean;
};

export const ExperienceView = ({ className, form, documentMode = false, heading = true }: ExperienceViewProps) => {
  const { fields, append, remove, update, replace } = useFormArray<Experience>(form, 'experience');

  const handleAdd = useCallback(
    (item: Experience) => {
      append(documentMode ? preserveDocumentFields(undefined, item) : item);
    },
    [append, documentMode],
  );

  const handleUpdate = useCallback(
    (index: number, item: Experience) => {
      update(index, documentMode ? preserveDocumentFields(fields[index], item) : item);
    },
    [documentMode, fields, update],
  );

  return (
    <section className={className}>
      {heading ? (
        <div className="mb-6">
          <SectionHeading copy={PROFILE_SECTIONS.experience} />
        </div>
      ) : null}
      <EntryList
        items={fields}
        copy={ENTRY_LISTS.experience}
        summarize={experienceSummary}
        renderForm={({ defaultValues, submitLabel, onSubmit, onCancel }) => (
          <ExperienceForm
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
