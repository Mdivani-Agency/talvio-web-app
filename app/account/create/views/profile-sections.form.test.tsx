import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useStore } from '@tanstack/react-form';
import { afterEach, describe, expect, it } from 'vitest';

import { useAppForm } from '@lib/forms/use-form';
import { accountSchema } from '@lib/schema/account.schema';
import { DEFAULT_ACCOUNT_DTO } from '@lib/models/account-defaults';
import type { AccountDto } from '@lib/types';

import { collectFieldErrors } from './profile-sections';

afterEach(cleanup);

function Harness({ initial }: { initial: AccountDto }) {
  const form = useAppForm<AccountDto>({ defaultValues: initial, schema: accountSchema, validateOn: 'submit' });
  const fieldMeta = useStore(form.store, (state) => state.fieldMeta);
  const errors = collectFieldErrors(fieldMeta);
  return (
    <>
      <form.Field name="profile.email">
        {(field) => (
          <input aria-label="Email" value={String(field.state.value ?? '')} onChange={(e) => field.handleChange(e.target.value)} />
        )}
      </form.Field>
      <button type="button" onClick={() => void form.handleSubmit()}>
        Save
      </button>
      <ul aria-label="errors">
        {errors.map((error) => (
          <li key={error.path}>{`${error.path} | ${error.label}: ${error.message}`}</li>
        ))}
      </ul>
    </>
  );
}

describe('collectFieldErrors with a submitted account form', () => {
  it('lists schema errors after a save and drops them once the field is fixed', async () => {
    const initial: AccountDto = {
      ...DEFAULT_ACCOUNT_DTO,
      profile: { ...DEFAULT_ACCOUNT_DTO.profile, email: 'maya@lindqvist' },
      skills: [{ name: 'x'.repeat(60) }],
    } as AccountDto;
    render(<Harness initial={initial} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    });
    const list = () => screen.getByRole('list', { name: 'errors' });
    expect([...list().querySelectorAll('li')].map((item) => item.textContent)).toEqual([
      'profile.email | Email: Invalid email address',
      'skills[0].name | Skills: Skill name must be less than 50 characters',
    ]);

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'maya@lindqvist.dev' } });
    });
    expect([...list().querySelectorAll('li')].map((item) => item.textContent)).toEqual([
      'skills[0].name | Skills: Skill name must be less than 50 characters',
    ]);
  });
});
