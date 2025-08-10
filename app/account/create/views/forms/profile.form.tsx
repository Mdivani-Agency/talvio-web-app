import { UseFormReturn } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, Input, Textarea } from "@components/ui";
import { cn } from "@lib/utils";
import { Profile } from "@lib/types";

type ProfileFormProps = {
  className?: string;
  form: UseFormReturn<{ profile: Profile }>;
};

export const ProfileForm = ({ className, form }: ProfileFormProps) => {
  return (
    <Form {...form}>
      <div className={cn("space-y-6", className)}>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="profile.firstName" render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input {...field} placeholder="First Name" error={form.formState.errors.profile?.firstName?.message} />
              </FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="profile.lastName" render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input {...field} placeholder="Last Name" error={form.formState.errors.profile?.lastName?.message} />
              </FormControl>
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="profile.role" render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input {...field} placeholder="Role" error={form.formState.errors.profile?.role?.message} />
            </FormControl>
          </FormItem>
        )} />

        <FormField control={form.control} name="profile.tagline" render={({ field }) => (
          <FormItem>
            <FormLabel size="sm" variant="muted">Summary</FormLabel>
            <FormControl>
              <Textarea {...field} placeholder="Write a brief summary" error={form.formState.errors.profile?.tagline?.message} />
            </FormControl>
          </FormItem>
        )} />
      </div>
    </Form>
  );
};
