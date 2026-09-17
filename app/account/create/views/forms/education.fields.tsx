import { Form, FormControl, Input, FormField, FormItem, Textarea, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, ExperienceRangePicker } from '@components/ui';
import { cn } from '@lib/utils';
import { DegreeTypeEnum } from '@lib/schema/enums';
import { z } from 'zod';
import { useStore } from '@tanstack/react-form';
import type { AppForm } from '@lib/forms/use-form';
import { fieldErrorMessage } from '@lib/forms/errors';

export const educationFormValuesSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  degreeType: DegreeTypeEnum.or(z.literal('')).refine((val) => val !== '', { message: 'Degree type is required' }),
  startDate: z.iso.datetime().or(z.literal('')),
  endDate: z.iso.datetime().or(z.literal('')).optional(),
  isPresent: z.iso.datetime().or(z.literal('')).optional(),
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
  const isPresent = useStore(form.store, (state) => String(state.values.isPresent ?? ''));

  return (
    <Form className={cn('space-y-6', className)}>
      <div className="grid grid-cols-2 gap-2">
        <FormField form={form} name="name">
          {(field) => (
            <FormItem>
              <FormControl>
                <Input
                  name={field.name}
                  value={String(field.state.value ?? '')}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="School Name"
                  error={fieldErrorMessage(field.state.meta.errors)}
                />
              </FormControl>
            </FormItem>
          )}
        </FormField>

        <FormField form={form} name="degreeType">
          {(field) => (
            <FormItem>
              <FormControl>
                <Select value={String(field.state.value ?? '')} onValueChange={(value) => field.handleChange(value)}>
                  <SelectTrigger error={fieldErrorMessage(field.state.meta.errors)}>
                    <SelectValue placeholder="Degree Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DegreeTypeEnum.options.map((degree) => (
                      <SelectItem key={degree} value={degree}>
                        {degree}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )}
        </FormField>
      </div>

      <ExperienceRangePicker
        range={{
          startDate,
          endDate,
          isPresent: Boolean(isPresent),
        }}
        onChange={(range) => {
          if (range.field === 'isPresent') {
            form.setFieldValue('isPresent', range.value ? new Date().toISOString() : '');
          } else {
            form.setFieldValue(range.field, range.value);
          }
        }}
      />

      <FormField form={form} name="additionalDetails">
        {(field) => (
          <FormItem>
            <FormControl>
              <Textarea
                name={field.name}
                value={String(field.state.value ?? '')}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="Additional Details"
                error={fieldErrorMessage(field.state.meta.errors)}
              />
            </FormControl>
          </FormItem>
        )}
      </FormField>
    </Form>
  );
};
