'use client';
import { useCallback, useState } from 'react';
import { Education } from '@lib/types';
import { OrderedList } from './ordered-list';
import { ConfirmModal } from '@components/modals';
import { Label } from '@components/ui';
import { EducationForm } from './forms/education.form';
import { FormList } from './form-list';
import type { AppForm } from '@lib/forms/use-form';
import { useFormArray } from '@lib/forms/use-form-array';

type EducationViewProps = {
  className?: string;
  form: AppForm;
};

export const EducationView = ({ className, form }: EducationViewProps) => {
  const [removeItemIndex, setRemoveItemIndex] = useState<number | null>(null);
  const { fields, append, remove, update } = useFormArray<Education>(form, 'education');

  const handleAddEducation = useCallback(
    (education: Education) => {
      append(education);
    },
    [append],
  );

  const handleUpdateEducation = useCallback(
    (index: number, education: Education) => {
      update(index, education);
    },
    [update],
  );

  const handleRemoveEducation = useCallback(
    (index: number) => {
      remove(index);
    },
    [remove],
  );

  return (
    <section className={className}>
      <Label size="lg" className="mb-6">
        Education
      </Label>
      <EducationForm action="add" onSubmit={handleAddEducation} />
      <OrderedList fields={fields} label="Education">
        {({ items, onReorder }) => (
          <FormList
            items={items}
            labelKey="name"
            renderForm={(item, onSubmit) => <EducationForm action="edit" onSubmit={onSubmit} defaultValues={item} />}
            onReorder={(nextItems) => {
              form.setFieldValue('education', nextItems);
              onReorder(nextItems);
            }}
            handleUpdateForm={handleUpdateEducation}
            handleRemoveForm={setRemoveItemIndex}
          />
        )}
      </OrderedList>
      <ConfirmModal
        isOpen={typeof removeItemIndex === 'number'}
        title="Remove Education"
        description="Please confirm you want to remove this item."
        icon={'TrashBin'}
        className="text-error"
        onClose={() => setRemoveItemIndex(null)}
        onConfirm={() => typeof removeItemIndex === 'number' && handleRemoveEducation(removeItemIndex)}
      />
    </section>
  );
};
