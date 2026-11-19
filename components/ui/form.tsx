'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { CircleAlert } from 'lucide-react';
import type { AnyFieldApi } from '@tanstack/react-form';
import type { AppForm } from '@lib/forms/use-form';

import { cn } from '@utils/tailwind';
import { Label, LabelProps } from '@components/ui/label';
import { fieldErrorMessage } from '@lib/forms/errors';

function Form({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="form" className={className} {...props} />;
}

type FormFieldContextValue = {
  field: AnyFieldApi;
};

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

type FormFieldProps = {
  form: AppForm;
  name: string;
  children: (field: AnyFieldApi) => React.ReactNode;
};

function FormField({ form, name, children }: FormFieldProps) {
  return (
    <form.Field name={name}>
      {(field) => (
        <FormFieldContext.Provider value={{ field }}>
          {children(field)}
        </FormFieldContext.Provider>
      )}
    </form.Field>
  );
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>');
  }

  const { id } = itemContext;
  const error = fieldErrorMessage(fieldContext.field.state.meta.errors);

  return {
    id,
    name: fieldContext.field.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    error,
    field: fieldContext.field,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue);

function FormItem({ className, ...props }: React.ComponentProps<'div'>) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div data-slot="form-item" className={cn('grid min-w-0 content-start gap-1.5', className)} {...props} />
    </FormItemContext.Provider>
  );
}

function FormLabel({ className, ...props }: LabelProps) {
  const { error, formItemId } = useFormField();

  return (
    // The label stays in the text colour on error; the message under the field says what is wrong.
    <Label
      data-slot="form-label"
      data-error={!!error}
      size="sm"
      className={cn('leading-[1.4286] font-medium text-foreground', className)}
      htmlFor={formItemId}
      {...props}
    />
  );
}

function FormControl({ ...props }: React.ComponentProps<typeof Slot>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  return (
    <Slot
      data-slot="form-control"
      id={formItemId}
      aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
      aria-invalid={!!error}
      {...props}
    />
  );
}

function FormDescription({ className, ...props }: React.ComponentProps<'p'>) {
  const { formDescriptionId } = useFormField();

  return (
    <p data-slot="form-description" id={formDescriptionId} className={cn('text-muted-foreground text-sm', className)} {...props} />
  );
}

function FormMessage({ className, ...props }: React.ComponentProps<'p'>) {
  const { error, formMessageId } = useFormField();
  const body = error ?? props.children;

  if (!body) {
    return null;
  }

  return (
    // Text in the foreground colour with a red icon: red text on the light background is below WCAG AA at this size.
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn('flex items-start gap-1.5 text-sm leading-[1.4286] text-foreground', className)}
      {...props}
    >
      <CircleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-destructive" strokeWidth={2} />
      <span>{body}</span>
    </p>
  );
}

export { useFormField, Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField };
