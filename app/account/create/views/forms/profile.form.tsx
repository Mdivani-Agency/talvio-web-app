import { Form, FormControl, FormField, FormItem, FormLabel, Input, Textarea } from '@components/ui';
import { cn } from '@lib/utils';
import type { AppForm } from '@lib/forms/use-form';
import { fieldErrorMessage } from '@lib/forms/errors';

type ProfileFormProps = {
  className?: string;
  form: AppForm;
};

export const ProfileForm = ({ className, form }: ProfileFormProps) => {
  return (
    <Form className={cn('space-y-6', className)}>
      <div className="grid grid-cols-2 gap-4">
        <FormField form={form} name="profile.firstName">
          {(field) => (
            <FormItem>
              <FormControl>
                <Input
                  name={field.name}
                  value={String(field.state.value ?? '')}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="First Name"
                  error={fieldErrorMessage(field.state.meta.errors)}
                />
              </FormControl>
            </FormItem>
          )}
        </FormField>
        <FormField form={form} name="profile.lastName">
          {(field) => (
            <FormItem>
              <FormControl>
                <Input
                  name={field.name}
                  value={String(field.state.value ?? '')}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Last Name"
                  error={fieldErrorMessage(field.state.meta.errors)}
                />
              </FormControl>
            </FormItem>
          )}
        </FormField>
      </div>

      <FormField form={form} name="profile.role">
        {(field) => (
          <FormItem>
            <FormControl>
              <Input
                name={field.name}
                value={String(field.state.value ?? '')}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="Role"
                error={fieldErrorMessage(field.state.meta.errors)}
              />
            </FormControl>
          </FormItem>
        )}
      </FormField>

      <FormField form={form} name="profile.tagline">
        {(field) => (
          <FormItem>
            <FormLabel size="sm" variant="muted">
              Summary
            </FormLabel>
            <FormControl>
              <Textarea
                size={'lg'}
                name={field.name}
                value={String(field.state.value ?? '')}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="Write a brief summary"
                error={fieldErrorMessage(field.state.meta.errors)}
              />
            </FormControl>
          </FormItem>
        )}
      </FormField>
    </Form>
  );
};
