import { Form } from '@components/ui';
import { cn } from '@lib/utils';
import { z } from 'zod';
import type { AppForm } from '@lib/forms/use-form';
import { PROJECT_FIELDS } from '@/lib/onboarding-copy';

import { TextFormField } from './text-form-field';

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
    <Form className={cn('space-y-4', className)}>
      <TextFormField form={form} name="name" copy={PROJECT_FIELDS.name} />
      <TextFormField form={form} name="url" copy={PROJECT_FIELDS.url} type="url" />
      <TextFormField form={form} name="additionalDetails" copy={PROJECT_FIELDS.additionalDetails} multiline />
    </Form>
  );
};
