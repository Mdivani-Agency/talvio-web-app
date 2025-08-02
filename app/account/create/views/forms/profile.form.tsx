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
      <div className={cn("space-y-8", className)}>
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
            <FormControl>
              <Textarea {...field} placeholder="Summary" />
            </FormControl>
          </FormItem>
        )} />

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
        <FormField control={form.control} name="profile.website" render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input {...field} placeholder="Website" />
            </FormControl>
          </FormItem>
        )} />

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
    </Form>
  );
};
