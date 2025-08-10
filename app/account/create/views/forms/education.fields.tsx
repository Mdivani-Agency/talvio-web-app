import { UseFormReturn } from "react-hook-form";
import { Form, FormControl, Input, FormField, FormItem, Textarea, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, ExperienceRangePicker } from "@components/ui";
import { cn } from "@lib/utils";
import { DegreeTypeEnum } from "@lib/schema/enums";
import { z } from "zod";

export const educationFormValuesSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  degreeType: DegreeTypeEnum.or(z.literal('')).refine((val) => val !== '', { message: 'Degree type is required' }),
  startDate: z.iso.datetime().or(z.literal('')),
  endDate: z.iso.datetime().or(z.literal('')).optional(),
  isPresent: z.iso.datetime().or(z.literal('')).optional(),
  additionalDetails: z.string(),
});

export type EducationFormValues = z.infer<typeof educationFormValuesSchema>;

type EducationFieldsProps = {
  className?: string;
  form: UseFormReturn<EducationFormValues>;
};

export const EducationFields = ({ className, form }: EducationFieldsProps) => {
  return (
      <Form {...form}>
        <form className={cn("space-y-6", className)}>
          <div className="grid grid-cols-2 gap-2">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="School Name" error={form.formState.errors.name?.message} />
                </FormControl>
              </FormItem>
            )} />

            <FormField control={form.control} name="degreeType" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger error={form.formState.errors.degreeType?.message}>
                      <SelectValue placeholder="Degree Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DegreeTypeEnum.options.map((degree) => (
                        <SelectItem key={degree} value={degree}>{degree}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )} />
          </div>

          <ExperienceRangePicker
            startDateError={form.formState.errors.startDate?.message}
            endDateError={form.formState.errors.endDate?.message}
            isPresentError={form.formState.errors.isPresent?.message}
            range={{
              startDate: form.watch('startDate'),
              endDate: form.watch('endDate'),
              isPresent: form.watch('isPresent') ? true : false,
            }}
            onChange={(range) => {
              if (range.field === 'isPresent') {
                form.setValue('isPresent', range.value ? new Date().toISOString() : '');
              } else {
                form.setValue(range.field, range.value);
              }
            }}
          />

          <FormField control={form.control} name="additionalDetails" render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea {...field} placeholder="Additional Details" />
              </FormControl>
            </FormItem>
          )} />
        </form>
      </Form>
  );
};
