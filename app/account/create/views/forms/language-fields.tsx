'use client';
import { useId, useState } from 'react';

import { Select, Pill, AutocompleteInput, Button, Label, SelectItem, SelectContent, SelectTrigger, SelectValue } from '@components/ui';
import { languageSchema } from '@lib/schema/account.schema';
import { Language, LanguageProficiency as LanguageProficiencyType } from '@lib/types';
import { LanguageProficiency } from '@lib/schema/enums';
import iso from 'iso-639-1';
import { Icon } from '@components/icons';
import type { AppForm } from '@lib/forms/use-form';
import { useFormArray } from '@lib/forms/use-form-array';
import { ADD_LANGUAGE_LABEL, HIGHLIGHT_FIELDS, LANGUAGES_LABEL } from '@/lib/onboarding-copy';

const LABEL_CLASS = 'leading-[1.4286] font-medium text-foreground';

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
  const id = useId();

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
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 text-md font-semibold text-primary">{LANGUAGES_LABEL}</legend>
      <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
        <div className="grid min-w-0 gap-1.5">
          <Label htmlFor={`${id}-language`} size="sm" className={LABEL_CLASS}>
            {HIGHLIGHT_FIELDS.language.label}
          </Label>
          <AutocompleteInput
            id={`${id}-language`}
            placeholder={HIGHLIGHT_FIELDS.language.example}
            options={iso.getAllNames()}
            selected={currentLanguage.language}
            onSelect={handleLanguageChange}
            onChange={handleLanguageChange}
          />
        </div>
        <div className="grid min-w-0 gap-1.5">
          <Label htmlFor={`${id}-proficiency`} size="sm" className={LABEL_CLASS}>
            {HIGHLIGHT_FIELDS.proficiency.label}
          </Label>
          <Select value={currentLanguage.proficiency} onValueChange={handleProficiencyChange}>
            <SelectTrigger id={`${id}-proficiency`}>
              <SelectValue placeholder={HIGHLIGHT_FIELDS.proficiency.example} />
            </SelectTrigger>
            <SelectContent>
              {LanguageProficiency.options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" variant="outline" size="icon" className="size-12" aria-label={ADD_LANGUAGE_LABEL} onClick={addLanguage}>
          <Icon type={'Add'} className={'size-4'} />
        </Button>
      </div>

      {fields.length > 0 && (
        <div className={'flex flex-wrap gap-1'}>
          {fields.map((skill, index) => (
            <Pill key={skill.id} title={skill.language} onRemove={() => remove(index)} />
          ))}
        </div>
      )}
    </fieldset>
  );
};
