import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@components/icons', () => ({ Icon: () => null }));

import { TooltipProvider } from '@components/ui';
import { EMPTY_RESUME_DOCUMENT } from '@lib/models/resume-document';

import { ResumeDocumentForm } from './resume.form';

afterEach(cleanup);

window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => undefined,
  removeListener: () => undefined,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  dispatchEvent: () => false,
})) as typeof window.matchMedia;

const renderForm = (issues?: { path: string; message: string }[]) =>
  render(
    <TooltipProvider>
      <ResumeDocumentForm defaultValues={EMPTY_RESUME_DOCUMENT} issues={issues} onSubmit={vi.fn()} />
    </TooltipProvider>,
  );

describe('ResumeDocumentForm', () => {
  it('opens About you first and one section at a time', () => {
    renderForm();
    const about = screen.getByRole('button', { name: 'About you' });
    const contact = screen.getByRole('button', { name: 'Contact information' });
    expect(about.getAttribute('aria-expanded')).toBe('true');
    expect(contact.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByRole('heading', { level: 2, name: 'Experience' })).toBeTruthy();

    fireEvent.click(contact);
    expect(contact.getAttribute('aria-expanded')).toBe('true');
    expect(about.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByLabelText('Email')).toBeTruthy();
  });

  it('lists download issues in words, opens their section and focuses the field', async () => {
    renderForm([
      { path: 'contacts.email', message: 'Enter a valid email address' },
      { path: 'experience.0.endDate', message: 'Choose an end date' },
    ]);
    const summary = screen.getByRole('group', { name: 'Fix 2 fields to download your PDF' });
    expect(screen.getByRole('link', { name: 'Experience 1, End date: Choose an end date' })).toBeTruthy();
    expect(document.activeElement).toBe(summary);
    expect(screen.getByRole('button', { name: 'Contact information' }).getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('button', { name: 'Contact information' }).getAttribute('aria-describedby')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'About you' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: 'Contact information, Email: Enter a valid email address' }));
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    });
    expect(screen.getByRole('button', { name: 'Contact information' }).getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement?.getAttribute('name')).toBe('contacts.email');
  });
});
