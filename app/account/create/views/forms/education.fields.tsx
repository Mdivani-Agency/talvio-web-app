import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, ExperienceRangePicker } from '@components/ui';
import { cn } from '@lib/utils';
import { DegreeTypeEnum } from '@lib/schema/enums';
import { z } from 'zod';
import { useStore } from '@tanstack/react-form';
import type { AppForm } from '@lib/forms/use-form';
import { EDUCATION_FIELDS } from '@/lib/onboarding-copy';

import { TextFormField } from './text-form-field';

export const educationFormValuesSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: 'Name is required' }),
  degreeType: DegreeTypeEnum.or(z.literal('')).refine((val) => val !== '', { message: 'Degree type is required' }),
  startDate: z.iso.datetime().or(z.literal('')),
  endDate: z.iso.datetime().or(z.literal('')).optional(),
  isPresent: z.boolean().optional(),
  additionalDetails: z.string(),
});

export type EducationFormValues = z.input<typeof educationFormValuesSchema>;

type EducationFieldsProps = {
  className?: string;
  form: AppForm;
};

export const EducationFields = ({ className, form }: EducationFieldsProps) => {
  const startDate = useStore(form.store, (state) => String(state.values.startDate ?? ''));
  const endDate = useStore(form.store, (state) => String(state.values.endDate ?? ''));
  const isPresent = useStore(form.store, (state) => Boolean(state.values.isPresent));

  return (
    <Form className={cn('space-y-4', className)}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextFormField form={form} name="name" copy={EDUCATION_FIELDS.name} />
        <FormField form={form} name="degreeType">
          {(field) => (
            <FormItem>
              <FormLabel>{EDUCATION_FIELDS.degreeType.label}</FormLabel>
              <Select value={String(field.state.value ?? '')} onValueChange={(value) => field.handleChange(value)}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={EDUCATION_FIELDS.degreeType.example} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DegreeTypeEnum.options.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        </FormField>
      </div>

      <ExperienceRangePicker
        range={{
          startDate,
          endDate,
          isPresent,
        }}
        onChange={(range) => {
          if (range.field === 'isPresent') {
            form.setFieldValue('isPresent', range.value);
          } else {
            form.setFieldValue(range.field, range.value);
          }
        }}
      />

      <TextFormField form={form} name="additionalDetails" copy={EDUCATION_FIELDS.additionalDetails} multiline />
    </Form>
  );
};
