import { City, Country } from 'country-state-city';
import { AutocompleteInput, Form, FormControl, FormField, FormItem, Input, Label } from '@components/ui';
import { cn } from '@lib/utils';
import type { AppForm } from '@lib/forms/use-form';
import { fieldErrorMessage } from '@lib/forms/errors';

export const ACCOUNT_CONTACT_FIELDS = {
  email: 'profile.email',
  phone: 'profile.phone',
  url: 'profile.website',
  city: 'profile.city',
  country: 'profile.country',
} as const;

export const RESUME_CONTACT_FIELDS = {
  email: 'contacts.email',
  phone: 'contacts.phone',
  url: 'contacts.url',
  city: 'location.city',
  country: 'location.country',
} as const;

type ContactFields = {
  email: string;
  phone: string;
  url: string;
  city: string;
  country: string;
};

type ContactsFormProps = {
  className?: string;
  form: AppForm;
  fields?: ContactFields;
};

export const ContactsForm = ({ className, form, fields = ACCOUNT_CONTACT_FIELDS }: ContactsFormProps) => {
  return (
    <Form className={cn('space-y-6', className)}>
      <Label size="lg">Contact Information</Label>
      <div className="grid grid-cols-2 gap-4">
        <FormField form={form} name={fields.email}>
          {(field) => (
            <FormItem>
              <FormControl>
                <Input
                  name={field.name}
                  value={String(field.state.value ?? '')}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Email"
                  error={fieldErrorMessage(field.state.meta.errors)}
                />
              </FormControl>
            </FormItem>
          )}
        </FormField>
        <FormField form={form} name={fields.phone}>
          {(field) => (
            <FormItem>
              <FormControl>
                <Input
                  name={field.name}
                  value={String(field.state.value ?? '')}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Phone"
                  error={fieldErrorMessage(field.state.meta.errors)}
                />
              </FormControl>
            </FormItem>
          )}
        </FormField>
      </div>
      <FormField form={form} name={fields.url}>
        {(field) => (
          <FormItem>
            <FormControl>
              <Input
                name={field.name}
                value={String(field.state.value ?? '')}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="Personal Website (optional)"
                error={fieldErrorMessage(field.state.meta.errors)}
              />
            </FormControl>
          </FormItem>
        )}
      </FormField>

      <div className="space-y-2">
        <Label size="sm" variant="muted">
          Location
        </Label>
        <div className="grid grid-cols-2 gap-4">
          <FormField form={form} name={fields.city}>
            {(field) => (
              <FormItem>
                <FormControl>
                  <AutocompleteInput
                    selected={String(field.state.value ?? '')}
                    placeholder="City"
                    options={City.getAllCities().map((city) => city.name)}
                    onSelect={(value) => field.handleChange(value)}
                    onChange={(value) => field.handleChange(value)}
                    error={fieldErrorMessage(field.state.meta.errors)}
                  />
                </FormControl>
              </FormItem>
            )}
          </FormField>
          <FormField form={form} name={fields.country}>
            {(field) => (
              <FormItem>
                <FormControl>
                  <AutocompleteInput
                    selected={String(field.state.value ?? '')}
                    placeholder="Country"
                    options={Country.getAllCountries().map((country) => country.name)}
                    onSelect={(value) => field.handleChange(value)}
                    onChange={(value) => field.handleChange(value)}
                    error={fieldErrorMessage(field.state.meta.errors)}
                  />
                </FormControl>
              </FormItem>
            )}
          </FormField>
        </div>
      </div>
    </Form>
  );
};
