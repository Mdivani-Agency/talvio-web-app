'use client';

import { useStore } from '@tanstack/react-form';
import type { AppForm } from '@lib/forms/use-form';

export function useFormArray<TItem extends Record<string, unknown>>(form: AppForm, name: string) {
  const values = useStore(form.store, (state) => {
    const value = state.values[name as keyof typeof state.values];
    return (Array.isArray(value) ? value : []) as TItem[];
  });

  const arrayApi = form as AppForm & {
    pushFieldValue: (field: string, value: TItem) => void;
    removeFieldValue: (field: string, index: number) => Promise<void>;
    replaceFieldValue: (field: string, index: number, value: TItem) => Promise<void>;
    setFieldValue: (field: string, value: TItem[]) => void;
  };

  return {
    fields: values.map((item, index) => ({
      ...item,
      id: typeof item.id === 'string' && item.id.length > 0 ? item.id : `${name}-${index}`,
    })),
    append: (item: TItem) => arrayApi.pushFieldValue(name, item),
    remove: (index: number) => {
      void arrayApi.removeFieldValue(name, index);
    },
    update: (index: number, item: TItem) => {
      void arrayApi.replaceFieldValue(name, index, item);
    },
    replace: (items: TItem[]) => arrayApi.setFieldValue(name, items),
  };
}
