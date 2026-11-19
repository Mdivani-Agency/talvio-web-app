import { City, Country } from 'country-state-city';
import { AutocompleteInput, Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@components/ui';
import { cn } from '@lib/utils';
import type { AppForm } from '@lib/forms/use-form';
import { CONTACT_FIELDS, PROFILE_SECTIONS } from '@/lib/onboarding-copy';

import { SectionHeading } from './section-heading';
import { TextFormField } from './text-form-field';

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
    <Form className={cn('space-y-4', className)}>
      <SectionHeading copy={PROFILE_SECTIONS.contact} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextFormField form={form} name={fields.email} copy={CONTACT_FIELDS.email} type="email" autoComplete="email" />
        <TextFormField form={form} name={fields.phone} copy={CONTACT_FIELDS.phone} type="tel" autoComplete="tel" />
      </div>
      <TextFormField form={form} name={fields.url} copy={CONTACT_FIELDS.website} type="url" autoComplete="url" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField form={form} name={fields.country}>
          {(field) => (
            <FormItem>
              <FormLabel>{CONTACT_FIELDS.country.label}</FormLabel>
              <FormControl>
                <AutocompleteInput
                  selected={String(field.state.value ?? '')}
                  placeholder={CONTACT_FIELDS.country.example}
                  options={Country.getAllCountries().map((country) => country.name)}
                  onSelect={(value) => field.handleChange(value)}
                  onChange={(value) => field.handleChange(value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        </FormField>
        <FormField form={form} name={fields.city}>
          {(field) => (
            <FormItem>
              <FormLabel>{CONTACT_FIELDS.city.label}</FormLabel>
              <FormControl>
                <AutocompleteInput
                  selected={String(field.state.value ?? '')}
                  placeholder={CONTACT_FIELDS.city.example}
                  options={City.getAllCities().map((city) => city.name)}
                  onSelect={(value) => field.handleChange(value)}
                  onChange={(value) => field.handleChange(value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        </FormField>
      </div>
    </Form>
  );
};
