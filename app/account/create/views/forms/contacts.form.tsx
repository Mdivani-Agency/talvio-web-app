import { UseFormReturn } from "react-hook-form";
import { City, Country } from 'country-state-city';
import { AutocompleteInput, Form, FormControl, FormField, FormItem, Input, Label } from "@components/ui";
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
                <Input {...field} placeholder="Email" error={form.formState.errors.profile?.email?.message} />
              </FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="profile.phone" render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input {...field} placeholder="Phone" error={form.formState.errors.profile?.phone?.message} />
              </FormControl>
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="profile.website" render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input {...field} placeholder="Personal Website (optional)" error={form.formState.errors.profile?.website?.message} />
            </FormControl>
          </FormItem>
        )} />

        <div className="space-y-2">
          <Label size="sm" variant="muted">Location</Label>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="profile.city" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <AutocompleteInput
                    selected={field.value}
                    placeholder="City"
                    options={City.getAllCities().map((city) => city.name)}
                    onSelect={field.onChange}
                    onChange={field.onChange}
                    error={form.formState.errors.profile?.city?.message}
                  />
                </FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="profile.country" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <AutocompleteInput
                    selected={field.value}
                    placeholder="Country"
                    options={Country.getAllCountries().map((country) => country.name)}
                    onSelect={field.onChange}
                    onChange={field.onChange}
                    error={form.formState.errors.profile?.country?.message}
                  />
                </FormControl>
                </FormItem>
              )} />
          </div>
        </div>
      </div>
    </Form>
  );
};
