import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ErrorSummary } from './error-summary';
import { collectFieldErrors } from './profile-sections';

afterEach(cleanup);

describe('ErrorSummary', () => {
  it('names the count and lists each error as a link that selects its field', () => {
    const errors = collectFieldErrors({
      'profile.firstName': { errors: ['Enter your first name.'] },
      'profile.email': { errors: ['Enter a valid email address.'] },
    });
    const onSelect = vi.fn();
    render(<ErrorSummary errors={errors} onSelect={onSelect} />);

    expect(screen.getByRole('group', { name: 'Fix 2 fields to save your profile' })).toBeTruthy();
    const links = screen.getAllByRole('link').map((link) => link.textContent);
    expect(links).toEqual(['First name: Enter your first name.', 'Email: Enter a valid email address.']);

    fireEvent.click(screen.getByRole('link', { name: 'Email: Enter a valid email address.' }));
    expect(onSelect).toHaveBeenCalledWith(errors[1]);
  });
});
