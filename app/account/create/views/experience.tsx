'use client';
import { useCallback, useState } from 'react';
import { ExperienceForm } from './forms/experience.form';
import { Experience } from '@lib/types';
import { OrderedList } from './ordered-list';
import { ConfirmModal } from '@components/modals';
import { Label } from '@components/ui';
import { FormList } from './form-list';
import type { AppForm } from '@lib/forms/use-form';
import { useFormArray } from '@lib/forms/use-form-array';

type ExperienceViewProps = {
  className?: string;
  form: AppForm;
};

export const ExperienceView = ({ className, form }: ExperienceViewProps) => {
  const [removeItemIndex, setRemoveItemIndex] = useState<number | null>(null);
  const { fields, append, remove, update, replace } = useFormArray<Experience>(form, 'experience');

  const handleAddExperience = useCallback(
    (experience: Experience) => {
      append(experience);
    },
    [append],
  );

  const handleUpdateExperience = useCallback(
    (index: number, experience: Experience) => {
      update(index, experience);
    },
    [update],
  );

  const handleRemoveExperience = useCallback(
    (index: number) => {
      remove(index);
    },
    [remove],
  );

  return (
    <section className={className}>
      <Label size="lg" className="mb-6">
        Experience
      </Label>
      <ExperienceForm action="add" onSubmit={handleAddExperience} />
      <OrderedList fields={fields} label="Experience">
        {({ items, onReorder }) => (
          <FormList
            items={items}
            labelKey="company"
            renderForm={(item, onSubmit) => <ExperienceForm action="edit" onSubmit={onSubmit} defaultValues={item} />}
            onReorder={(nextItems) => {
              replace(nextItems);
              onReorder(nextItems);
            }}
            handleUpdateForm={handleUpdateExperience}
            handleRemoveForm={setRemoveItemIndex}
          />
        )}
      </OrderedList>
      <ConfirmModal
        isOpen={typeof removeItemIndex === 'number'}
        title="Remove Experience"
        description="Please confirm you want to remove this item."
        icon={'TrashBin'}
        className="text-error"
        onClose={() => setRemoveItemIndex(null)}
        onConfirm={() => typeof removeItemIndex === 'number' && handleRemoveExperience(removeItemIndex)}
      />
    </section>
  );
};
