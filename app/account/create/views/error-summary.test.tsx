import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ErrorSummary, focusFieldError } from './error-summary';
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

describe('focusFieldError', () => {
  function page() {
    const root = document.createElement('div');
    root.innerHTML = `
      <section id="contact"><label for="e">Email</label><input id="e" name="profile.email" /></section>
      <section id="highlights">
        <label for="l">Other links (optional)</label><input id="l" />
        <label for="s">Skills</label><input id="s" />
      </section>
      <section id="experience"><label for="c">Company</label><input id="c" /></section>`;
    document.body.append(root);
    return root;
  }

  it('focuses the field by name, then the control its label names, then the section card', () => {
    const root = page();
    const [email, skill, experience] = collectFieldErrors({
      'profile.email': { errors: ['Invalid email address'] },
      'skills[0].name': { errors: ['Too long'] },
      'experience[1].startDate': { errors: ['Invalid date'] },
    });

    focusFieldError(root, email);
    expect(document.activeElement?.id).toBe('e');
    focusFieldError(root, skill);
    expect(document.activeElement?.id).toBe('s');
    focusFieldError(root, experience);
    expect(document.activeElement?.id).toBe('experience');
    root.remove();
  });
});
