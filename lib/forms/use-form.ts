'use client';

import { useForm, type ReactFormExtendedApi } from '@tanstack/react-form';
import type { StandardSchemaV1 } from '@tanstack/form-core';

// TanStack Form's public API is generic-heavy; the app passes one form instance
// through profile slices, so a single widened alias keeps call sites readable.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Form API generics are not useful at slice boundaries
export type AppForm = ReactFormExtendedApi<any, any, any, any, any, any, any, any, any, any, any, any>;

type UseAppFormOptions<TFormData> = {
  defaultValues: TFormData;
  schema?: StandardSchemaV1<TFormData, unknown>;
  onSubmit?: (value: TFormData) => void | Promise<void>;
  onValuesChange?: (value: TFormData) => void;
  validateOn?: 'change' | 'submit';
};

export function useAppForm<TFormData>({
  defaultValues,
  schema,
  onSubmit,
  onValuesChange,
  validateOn = 'change',
}: UseAppFormOptions<TFormData>): AppForm {
  return useForm({
    defaultValues,
    validators: schema
      ? validateOn === 'submit'
        ? { onSubmit: schema }
        : { onChange: schema }
      : undefined,
    onSubmit: onSubmit
      ? async ({ value }) => {
          await onSubmit(value);
        }
      : undefined,
    listeners: onValuesChange
      ? {
          onChange: ({ formApi }) => {
            onValuesChange(formApi.state.values);
          },
        }
      : undefined,
  });
}
