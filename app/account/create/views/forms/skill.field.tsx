'use client';

import { ManageSortableItems } from '@components/views/manage-sortable-items';
import { Skill } from '@lib/types';
import { useState } from 'react';
import { skillSchema } from '@lib/schema/account.schema';
import type { AppForm } from '@lib/forms/use-form';
import { useFormArray } from '@lib/forms/use-form-array';
import { HIGHLIGHT_FIELDS } from '@/lib/onboarding-copy';

interface SkillsFormFieldProps {
  form: AppForm;
  name: 'skills' | 'tools';
}

export const SkillsFormField = ({ form, name }: SkillsFormFieldProps) => {
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
      modalLabel={`Manage ${name}`}
      placeholder={HIGHLIGHT_FIELDS[name].example}
      errorsMessage={errorMessage}
      currentOption={currentOption}
      setCurrentOption={setCurrentOption}
      addItem={addSkill}
      removeItem={remove}
      handleSave={(skills) => replace(skills.map(({ name: skillName }) => ({ name: skillName })))}
    />
  );
};
