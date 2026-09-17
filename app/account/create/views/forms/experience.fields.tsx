import { Form, FormControl, Input, FormField, FormItem, Label, Textarea, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, ExperienceRangePicker, MultiListInput, ErrorBadge, InfoBadge } from '@components/ui';
import { cn } from '@lib/utils';
import { employmentTypeEnum, locationTypeEnum } from '@lib/schema/enums';
import { z } from 'zod';
import { useStore } from '@tanstack/react-form';
import type { AppForm } from '@lib/forms/use-form';
import { fieldErrorMessage } from '@lib/forms/errors';

export const experienceFormValuesSchema = z.object({
  company: z.string().min(1, { message: 'Company is required' }),
  jobTitle: z.string().min(1, { message: 'Job title is required' }),
  startDate: z.iso.datetime().or(z.literal('')),
  endDate: z.iso.datetime().or(z.literal('')).optional(),
  isPresent: z.iso.datetime().or(z.literal('')).optional(),
  employmentType: employmentTypeEnum.or(z.literal('')),
  locationType: locationTypeEnum.or(z.literal('')),
  additionalDetails: z.string(),
  achievements: z.array(z.string()),
  responsibilities: z.array(z.string()),
  keyContributions: z.array(z.string()),
});

export type ExperienceFormValues = z.input<typeof experienceFormValuesSchema>;

type ExperienceFieldsProps = {
  className?: string;
  form: AppForm;
};

export const ExperienceFields = ({ className, form }: ExperienceFieldsProps) => {
  const startDate = useStore(form.store, (state) => String(state.values.startDate ?? ''));
  const endDate = useStore(form.store, (state) => String(state.values.endDate ?? ''));
  const isPresent = useStore(form.store, (state) => String(state.values.isPresent ?? ''));
  const achievements = useStore(form.store, (state) => (state.values.achievements as string[] | undefined) ?? []);
  const responsibilities = useStore(form.store, (state) => (state.values.responsibilities as string[] | undefined) ?? []);
  const keyContributions = useStore(form.store, (state) => (state.values.keyContributions as string[] | undefined) ?? []);
  const achievementsError = useStore(form.store, (state) => fieldErrorMessage(state.fieldMeta.achievements?.errors ?? []));
  const responsibilitiesError = useStore(form.store, (state) => fieldErrorMessage(state.fieldMeta.responsibilities?.errors ?? []));
  const keyContributionsError = useStore(form.store, (state) => fieldErrorMessage(state.fieldMeta.keyContributions?.errors ?? []));
  const bulletPointErrors = achievementsError || responsibilitiesError || keyContributionsError;

  return (
    <Form className={cn('space-y-6', className)}>
      <div className="grid grid-cols-2 gap-2">
        <FormField form={form} name="company">
          {(field) => (
            <FormItem>
              <FormControl>
                <Input
                  name={field.name}
                  value={String(field.state.value ?? '')}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Company"
                  error={fieldErrorMessage(field.state.meta.errors)}
                />
              </FormControl>
            </FormItem>
          )}
        </FormField>

        <FormField form={form} name="jobTitle">
          {(field) => (
            <FormItem>
              <FormControl>
                <Input
                  name={field.name}
                  value={String(field.state.value ?? '')}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Job Title"
                  error={fieldErrorMessage(field.state.meta.errors)}
                />
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
            form.setFieldValue('isPresent', range.value ? new Date().toISOString() : undefined);
          } else {
            form.setFieldValue(range.field, range.value);
          }
        }}
      />

      <Label size="sm" variant="muted">
        Additional Details
      </Label>
      <div className="grid grid-cols-2 gap-2">
        <FormField form={form} name="employmentType">
          {(field) => (
            <FormItem>
              <FormControl>
                <Select value={String(field.state.value ?? '')} onValueChange={(value) => field.handleChange(value)}>
                  <SelectTrigger error={fieldErrorMessage(field.state.meta.errors)}>
                    <SelectValue placeholder="Select Employment Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {employmentTypeEnum.options.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )}
        </FormField>

        <FormField form={form} name="locationType">
          {(field) => (
            <FormItem>
              <FormControl>
                <Select value={String(field.state.value ?? '')} onValueChange={(value) => field.handleChange(value)}>
                  <SelectTrigger error={fieldErrorMessage(field.state.meta.errors)}>
                    <SelectValue placeholder="Select Location Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationTypeEnum.options.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )}
        </FormField>
      </div>

      <MultiListInput
        label="Bullet Points"
        badge={bulletPointErrors ? <ErrorBadge error={bulletPointErrors} /> : <InfoBadge info="Please try to add at list one item for each category" />}
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
            label: 'Key Contributions',
            items: keyContributions,
            onAdd: (item) => form.setFieldValue('keyContributions', [...keyContributions, item]),
            onRemove: (index) => form.setFieldValue('keyContributions', keyContributions.filter((_, i) => i !== index)),
          },
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
                placeholder="Additional Context (if necessary)"
                error={fieldErrorMessage(field.state.meta.errors)}
              />
            </FormControl>
          </FormItem>
        )}
      </FormField>
    </Form>
  );
};
