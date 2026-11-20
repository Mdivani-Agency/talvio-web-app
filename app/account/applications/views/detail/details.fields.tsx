'use client';

import { z } from 'zod';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, Input } from '@components/ui';
import type { ApplicationPatch } from '@/lib/adapters/application.adapter';
import { DETAIL_FIELDS } from '@/lib/applications-copy';
import type { AppForm } from '@lib/forms/use-form';
import { APPLICATION_TEXT_MAX } from '@lib/schema/application.schema';
import type { JobApplication } from '@lib/types';
import { cn } from '@lib/utils';

const tooLong = { message: `Use ${APPLICATION_TEXT_MAX} characters or fewer` };
const optionalText = z.string().trim().max(APPLICATION_TEXT_MAX, tooLong);
const optionalDate = z.union([z.literal(''), z.iso.date()], { message: 'Enter a valid date' });

/** The panel's text and date fields. Empty optional fields are `''` here and null in the database. */
export const detailsFormValuesSchema = z.object({
  position: z.string().trim().min(1, { message: 'Enter the position' }).max(APPLICATION_TEXT_MAX, tooLong),
  company: z.string().trim().min(1, { message: 'Enter the company' }).max(APPLICATION_TEXT_MAX, tooLong),
  location: optionalText,
  salary: optionalText,
  contact: optionalText,
  nextStep: optionalText,
  appliedOn: optionalDate,
  nextStepOn: optionalDate,
});
export type DetailsFormValues = z.input<typeof detailsFormValuesSchema>;
export type DetailsField = keyof DetailsFormValues;

export function detailsDefaults(application: JobApplication): DetailsFormValues {
  return {
    position: application.position,
    company: application.company,
    location: application.location ?? '',
    salary: application.salary ?? '',
    contact: application.contact ?? '',
    nextStep: application.nextStep ?? '',
    appliedOn: application.appliedOn ?? '',
    nextStepOn: application.nextStepOn ?? '',
  };
}

/** The patch for one field, or null when the saved value already matches. */
export function detailsPatch(application: JobApplication, field: DetailsField, raw: string): ApplicationPatch | null {
  const value = raw.trim();
  const current = detailsDefaults(application)[field];
  if (value === current) {
    return null;
  }
  if (field === 'position' || field === 'company') {
    return { [field]: value };
  }
  return { [field]: value === '' ? null : value };
}

type FieldProps = {
  form: AppForm;
  name: DetailsField;
  /** Called when the field should save: on blur for text, on change for dates. */
  onCommit: (name: DetailsField) => void;
  type?: 'text' | 'date';
  className?: string;
};

export function DetailsField({ form, name, onCommit, type = 'text', className }: FieldProps) {
  const copy = DETAIL_FIELDS[name] as { label: string; placeholder?: string };
  return (
    <FormField form={form} name={name}>
      {(field) => (
        <FormItem className={cn('min-w-0', className)}>
          <FormLabel>{copy.label}</FormLabel>
          <FormControl>
            <Input
              type={type}
              name={field.name}
              placeholder={copy.placeholder}
              value={String(field.state.value ?? '')}
              onBlur={() => {
                field.handleBlur();
                if (type === 'text') {
                  onCommit(name);
                }
              }}
              onChange={(event) => {
                field.handleChange(event.target.value);
                if (type === 'date') {
                  onCommit(name);
                }
              }}
              className="h-[4.4rem]"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    </FormField>
  );
}

/** Position, Company, Location, Salary, Applied on and Contact, two per row. */
export function DetailsFields({ form, onCommit }: { form: AppForm; onCommit: (name: DetailsField) => void }) {
  return (
    <Form className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <DetailsField form={form} name="position" onCommit={onCommit} />
      <DetailsField form={form} name="company" onCommit={onCommit} />
      <DetailsField form={form} name="location" onCommit={onCommit} />
      <DetailsField form={form} name="salary" onCommit={onCommit} />
      <DetailsField form={form} name="appliedOn" type="date" onCommit={onCommit} />
      <DetailsField form={form} name="contact" onCommit={onCommit} />
    </Form>
  );
}
