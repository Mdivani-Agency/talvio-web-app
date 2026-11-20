'use client';

import { ManageSortableItems } from '@components/views/manage-sortable-items';
import { Skill } from '@lib/types';
import { useState, type ReactNode } from 'react';
import { skillSchema } from '@lib/schema/account.schema';
import type { AppForm } from '@lib/forms/use-form';
import { useFormArray } from '@lib/forms/use-form-array';
import { HIGHLIGHT_FIELDS } from '@/lib/onboarding-copy';

interface SkillsFormFieldProps {
  form: AppForm;
  name: 'skills' | 'tools';
  /** Sits at the end of the label row. */
  labelAside?: ReactNode;
}

export const SkillsFormField = ({ form, name, labelAside }: SkillsFormFieldProps) => {
  const [currentOption, setCurrentOption] = useState('');
  const [errorMessage, setErrorMessage] = useState<string>();
  const { fields, append, remove, replace } = useFormArray<Skill>(form, name);

  const addSkill = async (skill: string) => {
    const { error, success } = skillSchema.safeParse({ name: skill });

    if (skill && success) {
      append({ name: skill });
      setCurrentOption('');
      setErrorMessage(undefined);
    }

    if (error) {
      setErrorMessage(error.message);
    }
  };

  return (
    <ManageSortableItems
      items={fields.map((field) => ({ id: field.id, name: field.name }))}
      label={HIGHLIGHT_FIELDS[name].label}
      labelAside={labelAside}
      modalLabel={`Manage ${name}`}
      placeholder={HIGHLIGHT_FIELDS[name].example}
      errorsMessage={errorMessage}
      currentOption={currentOption}
      setCurrentOption={setCurrentOption}
      addItem={addSkill}
      removeItem={remove}
      // Keep each item's stored fields (its id, and a skill's group) when the list is reordered.
      handleSave={(items) =>
        replace(items.map(({ id, name: itemName }) => {
          const current = fields.find((field) => field.id === id);
          return current ? { ...current, name: itemName } : { name: itemName };
        }))
      }
    />
  );
};
