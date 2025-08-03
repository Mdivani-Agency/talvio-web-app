'use client';
import { useFieldArray, UseFormReturn } from 'react-hook-form';

import { ManageSortableItems } from '@components/views/manage-sortable-items';
import { Highlights, Skill, SkillFields } from '@lib/types';
import { useState } from 'react';
import { skillSchema } from '@lib/schema/account.schema';

interface SkillsFormFieldProps {
  form: UseFormReturn<SkillFields>;
  name: keyof SkillFields;
}

export const SkillsFormField = ({ form, name }: SkillsFormFieldProps) => {
  const {
    control,
    formState: { errors },
    setError,
  } = form;

  const [currentOption, setCurrentOption] = useState('');

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name,
  });

  const addSkill = async (skill: string) => {
    const { error, success } = skillSchema.safeParse({ name: skill });

    if (skill && success) {
      append({ name: skill });
      setCurrentOption('');
    }

    if (error) {
      setError(`${name}.0`, { message: error.message });
    }
  };

  const removeSkill = (index: number) => {
    remove(index);
  };

  const handleSave = (skills: Skill[]) => {
    replace(skills);
  };

  return (
    <ManageSortableItems
      items={fields}
      modalLabel={`Manage ${name}`}
      placeholder={`Add ${name}`}
      errorsMessage={errors.skills?.[0]?.name?.message}
      currentOption={currentOption}
      setCurrentOption={setCurrentOption}
      addItem={addSkill}
      removeItem={removeSkill}
      handleSave={handleSave}
    />
  );
};
