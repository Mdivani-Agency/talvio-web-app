import { useId, useState } from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, ExperienceRangePicker, MultiListInput, ErrorBadge, InfoBadge, Label, TagField } from '@components/ui';
import { cn } from '@lib/utils';
import { employmentTypeEnum, locationTypeEnum } from '@lib/schema/enums';
import { z } from 'zod';
import { useStore } from '@tanstack/react-form';
import type { AppForm } from '@lib/forms/use-form';
import { fieldErrorMessage } from '@lib/forms/errors';
import { EXPERIENCE_FIELDS, STACK_COPY } from '@/lib/onboarding-copy';
import { STACK_MAX, stackItemSchema, stackSchema } from '@lib/schema/account.schema';
import { optionalFieldUse } from '@lib/template-fields';
import { useCurrentTemplate } from './template-context';

import { TextFormField } from './text-form-field';

export const experienceFormValuesSchema = z.object({
  id: z.string().optional(),
  company: z.string().min(1, { message: 'Company is required' }),
  jobTitle: z.string().min(1, { message: 'Job title is required' }),
  startDate: z.iso.datetime().or(z.literal('')),
  endDate: z.iso.datetime().or(z.literal('')).optional(),
  isPresent: z.boolean().optional(),
  employmentType: employmentTypeEnum.or(z.literal('')),
  locationType: locationTypeEnum.or(z.literal('')),
  additionalDetails: z.string(),
  achievements: z.array(z.string()),
  responsibilities: z.array(z.string()),
  keyContributions: z.array(z.string()),
  stack: stackSchema,
});

export type ExperienceFormValues = z.input<typeof experienceFormValuesSchema>;

type ExperienceFieldsProps = {
  className?: string;
  form: AppForm;
};

export const ExperienceFields = ({ className, form }: ExperienceFieldsProps) => {
  const startDate = useStore(form.store, (state) => String(state.values.startDate ?? ''));
  const endDate = useStore(form.store, (state) => String(state.values.endDate ?? ''));
  const isPresent = useStore(form.store, (state) => Boolean(state.values.isPresent));
  const achievements = useStore(form.store, (state) => (state.values.achievements as string[] | undefined) ?? []);
  const responsibilities = useStore(form.store, (state) => (state.values.responsibilities as string[] | undefined) ?? []);
  const keyContributions = useStore(form.store, (state) => (state.values.keyContributions as string[] | undefined) ?? []);
  const achievementsError = useStore(form.store, (state) => fieldErrorMessage(state.fieldMeta.achievements?.errors ?? []));
  const responsibilitiesError = useStore(form.store, (state) => fieldErrorMessage(state.fieldMeta.responsibilities?.errors ?? []));
  const keyContributionsError = useStore(form.store, (state) => fieldErrorMessage(state.fieldMeta.keyContributions?.errors ?? []));
  const bulletPointErrors = achievementsError || responsibilitiesError || keyContributionsError;

  return (
    <Form className={cn('space-y-4', className)}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextFormField form={form} name="company" copy={EXPERIENCE_FIELDS.company} />
        <TextFormField form={form} name="jobTitle" copy={EXPERIENCE_FIELDS.jobTitle} />
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField form={form} name="employmentType">
          {(field) => (
            <FormItem>
              <FormLabel>{EXPERIENCE_FIELDS.employmentType.label}</FormLabel>
              <Select value={String(field.state.value ?? '')} onValueChange={(value) => field.handleChange(value)}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={EXPERIENCE_FIELDS.employmentType.example} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {employmentTypeEnum.options.map((value) => (
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

        <FormField form={form} name="locationType">
          {(field) => (
            <FormItem>
              <FormLabel>{EXPERIENCE_FIELDS.locationType.label}</FormLabel>
              <Select value={String(field.state.value ?? '')} onValueChange={(value) => field.handleChange(value)}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={EXPERIENCE_FIELDS.locationType.example} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {locationTypeEnum.options.map((value) => (
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

      <MultiListInput
        label="Bullet points"
        badge={bulletPointErrors ? <ErrorBadge error={bulletPointErrors} /> : <InfoBadge info="Add at least one item to each list" />}
        items={{
          achievements: {
            label: 'Achievements',
            items: achievements,
            onAdd: (item) => form.setFieldValue('achievements', [...achievements, item]),
            onRemove: (index) => form.setFieldValue('achievements', achievements.filter((_, i) => i !== index)),
          },
          responsibilities: {
            label: 'Responsibilities',
            items: responsibilities,
            onAdd: (item) => form.setFieldValue('responsibilities', [...responsibilities, item]),
            onRemove: (index) => form.setFieldValue('responsibilities', responsibilities.filter((_, i) => i !== index)),
          },
          keyContributions: {
            label: 'Key contributions',
            items: keyContributions,
            onAdd: (item) => form.setFieldValue('keyContributions', [...keyContributions, item]),
            onRemove: (index) => form.setFieldValue('keyContributions', keyContributions.filter((_, i) => i !== index)),
          },
        }}
      />

      <StackField form={form} />

      <TextFormField form={form} name="additionalDetails" copy={EXPERIENCE_FIELDS.additionalDetails} multiline />
    </Form>
  );
};

/** The main technologies of the role, as tags. Shown under each role in the Technical template. */
function StackField({ form }: { form: AppForm }) {
  const stack = useStore(form.store, (state) => (state.values.stack as string[] | undefined) ?? []);
  const fieldError = useStore(form.store, (state) => fieldErrorMessage(state.fieldMeta.stack?.errors ?? []));
  const template = useCurrentTemplate();
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();
  const [addError, setAddError] = useState<string | undefined>(undefined);
  const error = addError ?? fieldError;

  return (
    <div className="grid min-w-0 content-start gap-1.5">
      <Label htmlFor={inputId} size="sm" className="leading-[1.4286] font-medium text-foreground">
        {STACK_COPY.label}
      </Label>
      <TagField
        id={inputId}
        items={stack}
        placeholder={STACK_COPY.example}
        removeLabel={STACK_COPY.remove}
        full={stack.length >= STACK_MAX}
        invalid={Boolean(error)}
        describedBy={error ? `${hintId} ${errorId}` : hintId}
        onAdd={(value) => {
          const parsed = stackItemSchema.safeParse(value);
          if (!parsed.success) {
            setAddError(parsed.error.issues[0]?.message);
            return;
          }
          setAddError(undefined);
          if (!stack.some((item) => item.toLowerCase() === parsed.data.toLowerCase())) {
            form.setFieldValue('stack', [...stack, parsed.data]);
          }
        }}
        onRemove={(index) => form.setFieldValue('stack', stack.filter((_, i) => i !== index))}
      />
      <p id={hintId} data-allow-small-text className="text-[1.3rem] text-muted-foreground">
        {STACK_COPY.hint(STACK_MAX)} {optionalFieldUse('stack', template)}
      </p>
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

