'use client';
import { useCallback, useState } from 'react';
import { useFieldArray, UseFormReturn } from 'react-hook-form';
import { ExperienceForm } from './forms/experience.form';
import { AccountDto, Experience } from '@lib/types';
import { OrderedList } from './ordered-list';
import { ConfirmModal } from '@components/modals';
import { Label } from '@components/ui';
import { FormList } from './form-list';

type ExperienceViewProps = {
  className?: string;
  form: UseFormReturn<AccountDto>;
};

export const ExperienceView = ({
  className,
  form,
}: ExperienceViewProps) => {
  const [removeItemIndex, setRemoveItemIndex] = useState<number | null>(null);
  const { control } = form;

  const { fields, append, remove, update, replace } = useFieldArray<AccountDto, 'experience'>({
    control,
    name: 'experience',
  });

  const handleAddExperience = useCallback((experience: Experience) => {
    append(experience);
  }, [append]);

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
      <Label size="lg" className="mb-6">Experience</Label>
      <ExperienceForm
        action="add"
        onSubmit={handleAddExperience}
      />
      <OrderedList<AccountDto, 'experience'> fields={fields} label="Experience">
        {({ items, onReorder }) => (
          <FormList
            items={items}
            labelKey="company"
            renderForm={(item, onSubmit) => (
              <ExperienceForm
                action="edit"
                onSubmit={onSubmit}
                defaultValues={item}
              />
            )}
            onReorder={(items) => {
              console.log('reordering items', items);
              replace(items);
              onReorder(items);
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
