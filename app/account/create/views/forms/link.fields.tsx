'use client';

import { ManageSortableItems } from '@components/views/manage-sortable-items';
import { Link } from '@lib/types';
import { useState } from 'react';
import { linkSchema } from '@lib/schema/account.schema';
import { getHostname } from '@lib/utils';
import type { AppForm } from '@lib/forms/use-form';
import { useFormArray } from '@lib/forms/use-form-array';

interface LinksFormFieldProps {
  form: AppForm;
}

export const LinksFormField = ({ form }: LinksFormFieldProps) => {
  const [currentOption, setCurrentOption] = useState('');
  const [errorMessage, setErrorMessage] = useState<string>();
  const { fields, append, remove, replace } = useFormArray<Link>(form, 'links');

  const addLink = async (link: string) => {
    const type = getHostname(link);
    const { error, success } = linkSchema.safeParse({ value: link, type });

    if (link && success) {
      append({ value: link, type });
      setCurrentOption('');
      setErrorMessage(undefined);
    }

    if (error) {
      setErrorMessage(error.message);
    }
  };

  return (
    <ManageSortableItems
      items={fields.map((field) => ({
        id: field.id,
        name: field.value,
      }))}
      modalLabel={`Manage Personal Links`}
      placeholder={`Other Personal Links (optional)`}
      errorsMessage={errorMessage}
      currentOption={currentOption}
      setCurrentOption={setCurrentOption}
      addItem={addLink}
      removeItem={remove}
      handleSave={(items) =>
        replace(
          items.map((item) => ({
            value: item.name,
            type: 'link',
          })),
        )
      }
    />
  );
};
