'use client';
import { useState } from 'react';
import { useFieldArray, UseFormReturn } from 'react-hook-form';

import { Select, Pill, AutocompleteInput, Button, SelectItem, SelectContent, SelectTrigger, SelectValue } from '@components/ui';
import { languageSchema } from '@lib/schema/account.schema';
import { Language, LanguageProficiency as LanguageProficiencyType } from '@lib/types';
import { LanguageProficiency } from '@lib/schema/enums';
import iso from 'iso-639-1';
import { Icon } from '@components/icons';

type LanguageFormFieldProps = {
  label?: string;
  form: UseFormReturn<{ languages?: Language[] }>;
};

export const LanguagesFormFields = ({ form }: LanguageFormFieldProps) => {
  const [currentLanguage, setLanguage] = useState<Language>({
    language: '',
    proficiency: 'beginner',
  });

  const { control, setError } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'languages',
  });

  const addLanguage = async () => {
    const { success, data, error } = await languageSchema.safeParse(currentLanguage);
    if (success) {
      append(data);
      setLanguage({ language: '', proficiency: 'beginner' });
    }

    if (error) {
      setError('languages', { message: error.message });
    }
  };

  const handleLanguageChange = (language: string) => {
    setLanguage({ ...currentLanguage, language });
  };

  const handleProficiencyChange = (proficiency: LanguageProficiencyType) => {
    if (proficiency) {
      setLanguage({ ...currentLanguage, proficiency });
    }
  };

  const handleRemove = (index: number) => {
    remove(index);
  };

  return (
    <div className={'flex flex-col gap-2'}>
      <div className={'grid md:grid-cols-2 gap-2'}>
        {/* Skill Name Field */}
          <AutocompleteInput
            placeholder={'Language'}
            options={iso.getAllNames()}
            selected={currentLanguage.language}
            onSelect={handleLanguageChange}
            onChange={handleLanguageChange}
          />

        {/* Proficiency Field */}
        <div className={'flex items-center gap-2'}>
          <Select
            value={currentLanguage.proficiency}
            onValueChange={handleProficiencyChange}
          >
            <SelectTrigger>
              <SelectValue placeholder={'Select Proficiency'} />
            </SelectTrigger>
            <SelectContent>
              {LanguageProficiency.options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type={'button'} variant={'outline'} size={'icon'} onClick={addLanguage} >
            <Icon type={'Add'} className={'size-4'} />
          </Button>
        </div>
      </div>

      {fields.length > 0 && (
        <div className={'flex flex-wrap gap-1'}>
          {fields.map((skill, index) => (
            <Pill key={index} title={skill.language} onRemove={() => handleRemove(index)} />
          ))}
        </div>
      )}
    </div>
  );
};
