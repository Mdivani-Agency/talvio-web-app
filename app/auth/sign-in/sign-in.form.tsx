'use client';
import { useId } from 'react';
import { useStore } from '@tanstack/react-form';
import { CircleAlert, LoaderCircle } from 'lucide-react';

import { Button } from '@components/ui/button';
import { Form, FormField, FormItem } from '@components/ui/form';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { fieldErrorMessage } from '@lib/forms/errors';
import { useAppForm } from '@lib/forms/use-form';
import {
  SIGN_IN_EMAIL_LABEL,
  SIGN_IN_EMAIL_PLACEHOLDER,
  SIGN_IN_SENDING_LABEL,
  SIGN_IN_SUBMIT_LABEL,
} from '@/lib/sign-in-copy';

import { signInSchema, SignInValues } from './schema';

interface SignInFormProps {
  onSubmit: (values: SignInValues) => void | Promise<void>;
  /** Called on every edit, so the page can clear an alert about the previous address. */
  onValuesChange?: () => void;
}

export const SignInForm = ({ onSubmit, onValuesChange }: SignInFormProps) => {
  const form = useAppForm<SignInValues>({
    defaultValues: { email: '' },
    schema: signInSchema,
    onSubmit,
    onValuesChange,
  });
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  // Errors show from the first submit on, then update as the address is edited.
  const submitted = useStore(form.store, (state) => state.submissionAttempts > 0);
  const inputId = useId();
  const errorId = `${inputId}-error`;

  return (
    <Form className="flex flex-col gap-6">
      <FormField form={form} name="email">
        {(field) => {
          const error = submitted ? fieldErrorMessage(field.state.meta.errors) : undefined;
          return (
            <FormItem className="gap-2">
              {/* The label and the message point at the <input> itself: FormControl would put them on Input's wrapper. */}
              <Label htmlFor={inputId} className="font-medium">
                {SIGN_IN_EMAIL_LABEL}
              </Label>
              <Input
                id={inputId}
                name={field.name}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={SIGN_IN_EMAIL_PLACEHOLDER}
                value={String(field.state.value ?? '')}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void form.handleSubmit();
                  }
                }}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                className="h-12 text-md aria-invalid:ring-[3px]"
              />
              {error ? (
                <p id={errorId} className="flex items-start gap-2 text-md leading-[1.4] text-foreground">
                  <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
                  {error}
                </p>
              ) : null}
            </FormItem>
          );
        }}
      </FormField>
      <Button
        type="button"
        loading={isSubmitting}
        aria-busy={isSubmitting}
        onClick={() => void form.handleSubmit()}
        className="h-12 w-full gap-2 text-md"
      >
        {isSubmitting ? <LoaderCircle aria-hidden="true" className="size-[1.8rem] animate-spin" /> : null}
        {isSubmitting ? SIGN_IN_SENDING_LABEL : SIGN_IN_SUBMIT_LABEL}
      </Button>
    </Form>
  );
};
