'use client';
import { useCallback } from 'react';
import type { Recommendation } from '@lib/types';
import { ENTRY_LISTS } from '@/lib/onboarding-copy';
import type { AppForm } from '@lib/forms/use-form';
import { useFormArray } from '@lib/forms/use-form-array';
import { preserveDocumentFields, resumeItemToAccountDialog } from '@lib/models/resume-document';

import { RecommendationForm } from './forms/recommendation.form';
import { EntryList } from './entry-list';
import { projectSummary } from './entry-summaries';

type RecommendationsViewProps = {
  className?: string;
  form: AppForm;
  /** Convert account-shaped dialogs into resume document items. */
  documentMode?: boolean;
};

/** The resume editor's recommendations: a short quote from someone, with their name and a link. */
export const RecommendationsView = ({ className, form, documentMode = false }: RecommendationsViewProps) => {
  const { fields, append, remove, update, replace } = useFormArray<Recommendation>(form, 'recommendations');

  const handleAdd = useCallback(
    (item: Recommendation) => append(documentMode ? preserveDocumentFields(undefined, item) : item),
    [append, documentMode],
  );
  const handleUpdate = useCallback(
    (index: number, item: Recommendation) =>
      update(index, documentMode ? preserveDocumentFields(fields[index], item) : item),
    [documentMode, fields, update],
  );

  return (
    <section className={className}>
      <EntryList
        items={fields}
        copy={ENTRY_LISTS.recommendations}
        summarize={projectSummary}
        renderForm={({ defaultValues, submitLabel, onSubmit, onCancel }) => (
          <RecommendationForm
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
