import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SIGN_IN_EMAIL_INVALID, SIGN_IN_EMAIL_REQUIRED, SIGN_IN_SENDING_LABEL, SIGN_IN_SUBMIT_LABEL } from '@/lib/sign-in-copy';

import { SignInForm } from './sign-in.form';

describe('SignInForm', () => {
  // Vitest runs without globals here, so Testing Library cannot clean up between tests on its own.
  afterEach(cleanup);

  const email = () => screen.getByLabelText('Email') as HTMLInputElement;
  const submit = () => fireEvent.click(screen.getByRole('button', { name: SIGN_IN_SUBMIT_LABEL }));

  it('labels the email field and shows no error before a submit', () => {
    render(<SignInForm onSubmit={vi.fn()} />);
    expect(email().type).toBe('email');
    expect(email().autocomplete).toBe('email');
    fireEvent.change(email(), { target: { value: 'ada' } });
    expect(email().getAttribute('aria-invalid')).toBe('false');
    expect(screen.queryByText(SIGN_IN_EMAIL_INVALID)).toBeNull();
  });

  it('shows the empty and invalid messages under the field, linked for screen readers', async () => {
    const onSubmit = vi.fn();
    render(<SignInForm onSubmit={onSubmit} />);

    submit();
    const required = await screen.findByText(SIGN_IN_EMAIL_REQUIRED);
    expect(email().getAttribute('aria-invalid')).toBe('true');
    expect(email().getAttribute('aria-describedby')).toBe(required.id);

    fireEvent.change(email(), { target: { value: 'ada@talvio' } });
    expect(await screen.findByText(SIGN_IN_EMAIL_INVALID)).toBeTruthy();

    fireEvent.change(email(), { target: { value: 'ada@example.com' } });
    await waitFor(() => expect(email().getAttribute('aria-invalid')).toBe('false'));
    expect(email().getAttribute('aria-describedby')).toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('sends a valid address and shows the sending state until it settles', async () => {
    let finish: () => void = () => {};
    const onSubmit = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const onValuesChange = vi.fn();
    render(<SignInForm onSubmit={onSubmit} onValuesChange={onValuesChange} />);

    fireEvent.change(email(), { target: { value: ' ada@example.com ' } });
    expect(onValuesChange).toHaveBeenCalled();
    submit();
    const sending = await screen.findByRole('button', { name: SIGN_IN_SENDING_LABEL });
    expect((sending as HTMLButtonElement).disabled).toBe(true);
    // The schema trims the address before it is sent.
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ email: 'ada@example.com' }));

    await act(async () => finish());
    expect(await screen.findByRole('button', { name: SIGN_IN_SUBMIT_LABEL })).toBeTruthy();
  });

  it('fills in the address from the last attempt once, without overwriting what was typed', async () => {
    const { rerender } = render(<SignInForm onSubmit={vi.fn()} />);
    fireEvent.change(email(), { target: { value: 'typed@example.com' } });
    rerender(<SignInForm initialEmail="ada@example.com" onSubmit={vi.fn()} />);
    expect(email().value).toBe('typed@example.com');

    cleanup();
    render(<SignInForm initialEmail="ada@example.com" onSubmit={vi.fn()} />);
    await waitFor(() => expect(email().value).toBe('ada@example.com'));
  });
});
