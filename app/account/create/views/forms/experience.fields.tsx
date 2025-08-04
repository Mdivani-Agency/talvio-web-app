import { UseFormReturn } from "react-hook-form";
import { Form, FormControl, Input, FormField, FormItem, Label, Textarea, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, ExperienceRangePicker } from "@components/ui";
import { cn } from "@lib/utils";
import { Experience } from "@lib/types";
import { employmentTypeEnum, locationTypeEnum } from "@lib/schema/enums";

type ExperienceFieldsProps = {
  className?: string;
  form: UseFormReturn<Experience>;
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
                <Select {...field}>
                  <SelectTrigger>
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
                <Select {...field}>
                  <SelectTrigger>
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
