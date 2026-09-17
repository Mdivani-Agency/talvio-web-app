'use client';
import { useState } from 'react';

import { Select, Pill, AutocompleteInput, Button, SelectItem, SelectContent, SelectTrigger, SelectValue } from '@components/ui';
import { languageSchema } from '@lib/schema/account.schema';
import { Language, LanguageProficiency as LanguageProficiencyType } from '@lib/types';
import { LanguageProficiency } from '@lib/schema/enums';
import iso from 'iso-639-1';
import { Icon } from '@components/icons';
import type { AppForm } from '@lib/forms/use-form';
import { useFormArray } from '@lib/forms/use-form-array';

type LanguageFormFieldProps = {
  label?: string;
  form: AppForm;
};

export const LanguagesFormFields = ({ form }: LanguageFormFieldProps) => {
  const [currentLanguage, setLanguage] = useState<Language>({
    language: '',
    proficiency: 'beginner',
  });

  const { fields, append, remove } = useFormArray<Language>(form, 'languages');

  const addLanguage = async () => {
    const { success, data } = languageSchema.safeParse(currentLanguage);
    if (success) {
      append(data);
      setLanguage({ language: '', proficiency: 'beginner' });
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

  return (
    <div className={'flex flex-col gap-2'}>
      <div className={'grid md:grid-cols-2 gap-2'}>
        <AutocompleteInput
          placeholder={'Language'}
          options={iso.getAllNames()}
          selected={currentLanguage.language}
          onSelect={handleLanguageChange}
          onChange={handleLanguageChange}
        />

        <div className={'flex items-center gap-2'}>
          <Select value={currentLanguage.proficiency} onValueChange={handleProficiencyChange}>
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
          <Button type={'button'} variant={'outline'} size={'icon'} onClick={addLanguage}>
            <Icon type={'Add'} className={'size-4'} />
          </Button>
        </div>
      </div>

      {fields.length > 0 && (
        <div className={'flex flex-wrap gap-1'}>
          {fields.map((skill, index) => (
            <Pill key={skill.id} title={skill.language} onRemove={() => remove(index)} />
          ))}
        </div>
      )}
    </div>
  );
};
