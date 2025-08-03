import { UseFormReturn } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, Input, Label, Textarea } from "@components/ui";
import { cn } from "@lib/utils";
import { Profile } from "@lib/types";

type ContactsFormProps = {
  className?: string;
  form: UseFormReturn<{ profile: Profile }>;
};

export const ContactsForm = ({ className, form }: ContactsFormProps) => {
  return (
    <Form {...form}>
      <div className={cn("space-y-6", className)}>
        <Label size="lg">Contact Information</Label>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="profile.email" render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input {...field} placeholder="Email" />
              </FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="profile.phone" render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input {...field} placeholder="Phone" />
              </FormControl>
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="profile.website" render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input {...field} placeholder="Personal Website (optional)" />
            </FormControl>
          </FormItem>
        )} />

        <div className="space-y-2">
          <Label size="sm" variant="muted">Location</Label>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="profile.city" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="City" />
                </FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="profile.country" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="Country" />
                </FormControl>
                </FormItem>
              )} />
          </div>
        </div>
      </div>
    </Form>
  );
};
