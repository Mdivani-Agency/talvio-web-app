'use client';
import { Form, FormControl, FormField, FormItem } from '@components/ui/form';
import { signInSchema, SignInValues } from './schema';
import { useAppForm } from '@lib/forms/use-form';
import { Input } from '@components/ui/input';
import { Button } from '@components/ui/button';
import { useStore } from '@tanstack/react-form';

interface SignInFormProps {
  onSubmit: (values: SignInValues) => void;
}

export const SignInForm = ({ onSubmit }: SignInFormProps) => {
  const form = useAppForm<SignInValues>({
    defaultValues: { email: '' },
    schema: signInSchema,
    onSubmit,
  });
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  return (
    <Form className="flex flex-col gap-4">
      <FormField form={form} name="email">
        {(field) => (
          <FormItem>
            <FormControl>
              <Input
                name={field.name}
                value={String(field.state.value ?? '')}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="Email"
                aria-label="Email"
              />
            </FormControl>
          </FormItem>
        )}
      </FormField>
      <Button loading={isSubmitting} type="button" onClick={() => void form.handleSubmit()}>
        With Email
      </Button>
    </Form>
  );
};
