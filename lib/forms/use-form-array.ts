'use client';

import { useStore } from '@tanstack/react-form';
import type { AppForm } from '@lib/forms/use-form';

/**
 * Give every item an id for list keys. A saved row keeps its id; a new one gets `${name}-${index}`. Reordering stores
 * those keys in the values, so a later fallback could repeat one that moved; skip any key already taken.
 */
export function withListIds<TItem extends Record<string, unknown>>(values: TItem[], name: string) {
  const taken = new Set(values.map((item) => item.id).filter((id): id is string => typeof id === 'string' && id.length > 0));
  return values.map((item, index) => {
    if (typeof item.id === 'string' && item.id.length > 0) return { ...item, id: item.id };
    let id = `${name}-${index}`;
    for (let n = 1; taken.has(id); n += 1) id = `${name}-${index}-${n}`;
    taken.add(id);
    return { ...item, id };
  });
}

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
    fields: withListIds(values, name),
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
