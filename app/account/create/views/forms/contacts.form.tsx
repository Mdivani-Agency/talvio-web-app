import { City, Country } from 'country-state-city';
import { AutocompleteInput, Form, FormControl, FormField, FormItem, Input, Label } from '@components/ui';
import { cn } from '@lib/utils';
import type { AppForm } from '@lib/forms/use-form';
import { fieldErrorMessage } from '@lib/forms/errors';

type ContactsFormProps = {
  className?: string;
  form: AppForm;
};

export const ContactsForm = ({ className, form }: ContactsFormProps) => {
  return (
    <Form className={cn('space-y-6', className)}>
      <Label size="lg">Contact Information</Label>
      <div className="grid grid-cols-2 gap-4">
        <FormField form={form} name="profile.email">
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
        <FormField form={form} name="profile.phone">
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
      <FormField form={form} name="profile.website">
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
          <FormField form={form} name="profile.city">
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
          <FormField form={form} name="profile.country">
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
