import { UseFormReturn } from "react-hook-form";
import { Form, FormControl, Input, FormField, FormItem, Textarea } from "@components/ui";
import { cn } from "@lib/utils";
import { z } from "zod";

export const projectFormValuesSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  url: z.url().optional(),
  additionalDetails: z.string().min(150, { message: 'Additional details must be at least 150 characters long' }),
});

export type ProjectFormValues = z.infer<typeof projectFormValuesSchema>;

type ProjectFieldsProps = {
  className?: string;
  form: UseFormReturn<ProjectFormValues>;
};

export const ProjectFields = ({ className, form }: ProjectFieldsProps) => {
  return (
      <Form {...form}>
        <form className={cn("space-y-6", className)}>
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input {...field} placeholder="Project Name" error={form.formState.errors.name?.message} />
              </FormControl>
            </FormItem>
          )} />

          <FormField control={form.control} name="url" render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input {...field} placeholder="Project URL" error={form.formState.errors.url?.message} />
              </FormControl>
            </FormItem>
          )} />

          <FormField control={form.control} name="additionalDetails" render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea {...field} placeholder="Additional Details" error={form.formState.errors.additionalDetails?.message} />
              </FormControl>
            </FormItem>
          )} />
        </form>
      </Form>
  );
};
