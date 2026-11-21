import { Form } from '@components/ui';
import { cn } from '@lib/utils';
import { z } from 'zod';
import type { AppForm } from '@lib/forms/use-form';
import { RECOMMENDATION_FIELDS } from '@/lib/onboarding-copy';

import { TextFormField } from './text-form-field';

export const recommendationFormValuesSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, { message: 'Add who recommends you' }),
  url: z.url({ message: 'Add a link, such as their LinkedIn profile' }),
  additionalDetails: z.string().trim().min(1, { message: 'Add what they said' }),
});

export type RecommendationFormValues = z.input<typeof recommendationFormValuesSchema>;

export const RecommendationFields = ({ className, form }: { className?: string; form: AppForm }) => (
  <Form className={cn('space-y-4', className)}>
    <TextFormField form={form} name="name" copy={RECOMMENDATION_FIELDS.name} />
    <TextFormField form={form} name="url" copy={RECOMMENDATION_FIELDS.url} type="url" />
    <TextFormField form={form} name="additionalDetails" copy={RECOMMENDATION_FIELDS.additionalDetails} multiline />
  </Form>
);
