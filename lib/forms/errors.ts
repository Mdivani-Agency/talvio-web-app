import type { AnyFormApi } from '@tanstack/react-form';

export function fieldErrorMessage(errors: unknown[]): string | undefined {
  const first = errors[0];
  if (first == null) return undefined;
  if (typeof first === 'string') return first;
  if (typeof first === 'object' && 'message' in first && first.message) {
    return String(first.message);
  }
  return undefined;
}

export function firstFormError(form: AnyFormApi): string | undefined {
  const { form: formErrors, fields } = form.getAllErrors();
  const formMessage = fieldErrorMessage(formErrors.errors);
  if (formMessage) return formMessage;

  for (const field of Object.values(fields)) {
    const message = fieldErrorMessage(field.errors);
    if (message) return message;
  }

  return undefined;
}

export function hasFieldError(form: AnyFormApi, key: string) {
  const { fields } = form.getAllErrors();
  return Object.entries(fields).some(
    ([name, meta]) => (name === key || name.startsWith(`${key}.`)) && meta.errors.length > 0,
  );
}
