import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

import { useAppForm } from '@lib/forms/use-form';
import { PROFILE_FIELDS } from '@/lib/onboarding-copy';

import { TextFormField } from './text-form-field';

afterEach(cleanup);

const schema = z.object({ firstName: z.string().min(1, { message: 'Enter your first name.' }) });

function Harness() {
  const form = useAppForm({ defaultValues: { firstName: '' }, schema, validateOn: 'submit' });
  return (
    <>
      <TextFormField form={form} name="firstName" copy={PROFILE_FIELDS.firstName} />
      <button type="button" onClick={() => void form.handleSubmit()}>
        Save
      </button>
    </>
  );
}

describe('TextFormField', () => {
  it('names the input with its visible label and shows the example as placeholder', () => {
    render(<Harness />);
    const input = screen.getByLabelText('First name');
    expect(input.tagName).toBe('INPUT');
    expect(input.getAttribute('placeholder')).toBe('Maya');
    expect(input.getAttribute('aria-invalid')).toBe('false');
  });

  it('shows the error under the field and ties it to the input', async () => {
    render(<Harness />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    });
    const input = screen.getByLabelText('First name');
    const message = screen.getByText('Enter your first name.');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toContain(message.closest('p')!.id);
  });
});
