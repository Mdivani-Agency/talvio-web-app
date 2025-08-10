import { UseFormReturn } from "react-hook-form";
import { Form, FormControl, Input, FormField, FormItem, Label, Textarea, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, ExperienceRangePicker } from "@components/ui";
import { cn } from "@lib/utils";
import { employmentTypeEnum, locationTypeEnum } from "@lib/schema/enums";
import { z } from "zod";

export type ExperienceFormValues = z.infer<typeof experienceFormValuesSchema>;

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

type ExperienceFieldsProps = {
  className?: string;
  form: UseFormReturn<ExperienceFormValues>;
};

export const ExperienceFields = ({ className, form }: ExperienceFieldsProps) => {
  return (
      <Form {...form}>
        <form className={cn("space-y-6", className)}>
        <div className="grid grid-cols-2 gap-2">
          <FormField control={form.control} name="company" render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input {...field} placeholder="Company" error={form.formState.errors.company?.message} />
              </FormControl>
            </FormItem>
          )} />

          <FormField control={form.control} name="jobTitle" render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input {...field} placeholder="Job Title" error={form.formState.errors.jobTitle?.message} />
              </FormControl>
            </FormItem>
          )} />
        </div>

        <ExperienceRangePicker
          range={{
            startDate: form.watch('startDate'),
            endDate: form.watch('endDate'),
            isPresent: form.watch('isPresent') ? true : false,
          }}
          onChange={(range) => {
            if (range.field === 'isPresent') {
              form.setValue('isPresent', range.value ? new Date().toISOString() : undefined);
            } else {
              form.setValue(range.field, range.value);
            }
          }}
        />

        <Label size="sm" variant="muted">Additional Details</Label>
        <div className="grid grid-cols-2 gap-2">
          <FormField control={form.control} name='employmentType' render={({ field }) => (
            <FormItem>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger error={form.formState.errors.employmentType?.message}>
                    <SelectValue placeholder="Select Employment Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {employmentTypeEnum.options.map((value) => (
                      <SelectItem key={value} value={value}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )} />

          <FormField control={form.control} name="locationType" render={({ field }) => (
            <FormItem>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger error={form.formState.errors.locationType?.message}>
                    <SelectValue placeholder="Select Location Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationTypeEnum.options.map((value) => (
                      <SelectItem key={value} value={value}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="additionalDetails" render={({ field }) => (
          <FormItem>
            <FormControl>
              <Textarea {...field} placeholder="Additional Details" />
            </FormControl>
          </FormItem>
        )} />

        <FormField control={form.control} name="achievements" render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input {...field} placeholder="Achievements" error={form.formState.errors.achievements?.message} />
            </FormControl>
          </FormItem>
        )} />

        <FormField control={form.control} name="responsibilities" render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input {...field} placeholder="Responsibilities" error={form.formState.errors.responsibilities?.message} />
            </FormControl>
          </FormItem>
        )} />

        <FormField control={form.control} name="keyContributions" render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input {...field} placeholder="Key Contributions" error={form.formState.errors.keyContributions?.message} />
            </FormControl>
          </FormItem>
        )} />
        </form>
      </Form>
  );
};
