import { UseFormReturn } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, Input, Label, Textarea } from "@components/ui";
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
        <Label size="lg">Personal Details</Label>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="profile.firstName" render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input {...field} placeholder="First Name" />
              </FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="profile.lastName" render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input {...field} placeholder="Last Name" />
              </FormControl>
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="profile.role" render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input {...field} placeholder="Role" />
            </FormControl>
          </FormItem>
        )} />

        <FormField control={form.control} name="profile.tagline" render={({ field }) => (
          <FormItem>
            <FormLabel size="sm" variant="muted">Summary</FormLabel>
            <FormControl>
              <Textarea {...field} placeholder="Write a brief summary" />
            </FormControl>
          </FormItem>
        )} />
      </div>
    </Form>
  );
};
