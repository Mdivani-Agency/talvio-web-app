'use client';
import { useFieldArray, UseFormReturn } from 'react-hook-form';

import { ManageSortableItems } from '@components/views/manage-sortable-items';
import { Link } from '@lib/types';
import { useState } from 'react';
import { linkSchema } from '@lib/schema/account.schema';
import { getHostname } from '@lib/utils';

interface LinksFormFieldProps {
  form: UseFormReturn<{ links?: Link[] }>;
}

export const LinksFormField = ({ form }: LinksFormFieldProps) => {
  const {
    control,
    formState: { errors },
    setError,
  } = form;

  const [currentOption, setCurrentOption] = useState('');

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'links',
  });

  const addLink = async (link: string) => {
    const type = getHostname(link);
    const { error, success } = linkSchema.safeParse({ value: link, type });

    if (link && success) {
      append({ value: link, type });
      setCurrentOption('');
    }

    if (error) {
      setError(`links.0`, { message: error.message });
    }
  };

  const removeLink = (index: number) => {
    remove(index);
  };

  const handleSave = (links: Link[]) => {
    replace(links);
  };

  return (
    <ManageSortableItems
      items={fields.map((field) => ({
        id: field.id,
        name: field.value,
      }))}
      modalLabel={`Manage Personal Links`}
      placeholder={`Other Personal Links (optional)`}
      errorsMessage={errors.links?.[0]?.value?.message}
      currentOption={currentOption}
      setCurrentOption={setCurrentOption}
      addItem={addLink}
      removeItem={removeLink}
      handleSave={(items) => handleSave(items.map((item) => ({
        value: item.name,
        type: 'link',
      })))
      }
    />
  );
};
