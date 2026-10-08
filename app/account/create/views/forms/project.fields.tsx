import { Form, FormControl, Input, FormField, FormItem, Textarea } from '@components/ui';
import { cn } from '@lib/utils';
import { z } from 'zod';
import type { AppForm } from '@lib/forms/use-form';
import { fieldErrorMessage } from '@lib/forms/errors';

export const projectFormValuesSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: 'Name is required' }),
  url: z.url().optional(),
  additionalDetails: z.string().min(150, { message: 'Additional details must be at least 150 characters long' }),
});

export type ProjectFormValues = z.input<typeof projectFormValuesSchema>;

type ProjectFieldsProps = {
  className?: string;
  form: AppForm;
};

export const ProjectFields = ({ className, form }: ProjectFieldsProps) => {
  return (
    <Form className={cn('space-y-6', className)}>
      <FormField form={form} name="name">
        {(field) => (
          <FormItem>
            <FormControl>
              <Input
                name={field.name}
                value={String(field.state.value ?? '')}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="Project Name"
                error={fieldErrorMessage(field.state.meta.errors)}
              />
            </FormControl>
          </FormItem>
        )}
      </FormField>

      <FormField form={form} name="url">
        {(field) => (
          <FormItem>
            <FormControl>
              <Input
                name={field.name}
                value={String(field.state.value ?? '')}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="Project URL"
                error={fieldErrorMessage(field.state.meta.errors)}
              />
            </FormControl>
          </FormItem>
        )}
      </FormField>

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
