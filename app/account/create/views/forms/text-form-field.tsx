import { FormControl, FormField, FormItem, FormLabel, FormMessage, Input, Textarea } from '@components/ui';
import type { AppForm } from '@lib/forms/use-form';
import type { FieldCopy } from '@/lib/onboarding-copy';

type TextFormFieldProps = {
  form: AppForm;
  name: string;
  copy: FieldCopy;
  /** A textarea instead of a single-line input. */
  multiline?: boolean;
  type?: React.HTMLInputTypeAttribute;
  autoComplete?: string;
  className?: string;
};

/**
 * A text field with its visible label above, the example as placeholder, and its error under it. The label names the
 * control for screen readers (`FormLabel` and `FormControl` share the id), and the control gets `aria-invalid` and
 * `aria-describedby` from `FormControl` when the schema reports an error.
 */
export function TextFormField({ form, name, copy, multiline = false, type, autoComplete, className }: TextFormFieldProps) {
  return (
    <FormField form={form} name={name}>
      {(field) => (
        <FormItem className={className}>
          <FormLabel>{copy.label}</FormLabel>
          <FormControl>
            {multiline ? (
              <Textarea
                size="lg"
                name={field.name}
                value={String(field.state.value ?? '')}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder={copy.example}
              />
            ) : (
              <Input
                type={type}
                autoComplete={autoComplete}
                name={field.name}
                value={String(field.state.value ?? '')}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder={copy.example}
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    </FormField>
  );
}
