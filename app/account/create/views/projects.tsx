'use client';
import { useCallback } from 'react';
import { Project } from '@lib/types';
import { ENTRY_LISTS, PROFILE_SECTIONS } from '@/lib/onboarding-copy';

import { SectionHeading } from './forms/section-heading';
import { ProjectForm } from './forms/project.form';
import { EntryList } from './entry-list';
import { projectSummary } from './entry-summaries';
import type { AppForm } from '@lib/forms/use-form';
import { useFormArray } from '@lib/forms/use-form-array';
import { preserveDocumentFields, resumeItemToAccountDialog } from '@lib/models/resume-document';

type ProjectsViewProps = {
  className?: string;
  form: AppForm;
  /** Convert account-shaped dialogs into resume document items. */
  documentMode?: boolean;
};

export const ProjectsView = ({ className, form, documentMode = false }: ProjectsViewProps) => {
  const { fields, append, remove, update, replace } = useFormArray<Project>(form, 'projects');

  const handleAdd = useCallback(
    (item: Project) => {
      append(documentMode ? preserveDocumentFields(undefined, item) : item);
    },
    [append, documentMode],
  );

  const handleUpdate = useCallback(
    (index: number, item: Project) => {
      update(index, documentMode ? preserveDocumentFields(fields[index], item) : item);
    },
    [documentMode, fields, update],
  );

  return (
    <section className={className}>
      <div className="mb-6">
        <SectionHeading copy={PROFILE_SECTIONS.projects} />
      </div>
      <EntryList
        items={fields}
        copy={ENTRY_LISTS.projects}
        summarize={projectSummary}
        renderForm={({ defaultValues, submitLabel, onSubmit, onCancel }) => (
          <ProjectForm
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
