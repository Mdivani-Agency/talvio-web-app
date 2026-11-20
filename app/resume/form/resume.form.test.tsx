import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@components/icons', () => ({ Icon: () => null }));

import { TooltipProvider } from '@components/ui';
import { EMPTY_RESUME_DOCUMENT } from '@lib/models/resume-document';

import { CurrentTemplateProvider } from '@app/account/create/views/forms/template-context';

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

  it('opens the list entry an issue belongs to and focuses its field', async () => {
    const values = {
      ...EMPTY_RESUME_DOCUMENT,
      experience: [{ id: 'e1', company: 'Northwind Health', jobTitle: 'Engineer', startDate: '2024-01-15T00:00:00.000Z', isPresent: true }],
    } as typeof EMPTY_RESUME_DOCUMENT;
    render(
      <TooltipProvider>
        <ResumeDocumentForm
          defaultValues={values}
          issues={[{ path: 'experience.0.company', message: 'Enter the company' }]}
          onSubmit={vi.fn()}
        />
      </TooltipProvider>,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: 'Experience 1, Company: Enter the company' }));
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    });
    expect(screen.getByRole('heading', { name: /^Edit / })).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByLabelText('Company'));
  });

  it('focuses the date picker a date issue names, not the first field of the entry', async () => {
    const values = {
      ...EMPTY_RESUME_DOCUMENT,
      experience: [{ id: 'e1', company: 'Northwind Health', jobTitle: 'Engineer', isPresent: false }],
    } as typeof EMPTY_RESUME_DOCUMENT;
    render(
      <TooltipProvider>
        <ResumeDocumentForm
          defaultValues={values}
          issues={[{ path: 'experience.0.startDate', message: 'Choose a start date' }]}
          onSubmit={vi.fn()}
        />
      </TooltipProvider>,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: 'Experience 1, Start date: Choose a start date' }));
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    });
    const startMonth = screen.getByRole('button', { name: 'Start date, month: not chosen' });
    expect(document.activeElement).toBe(startMonth);
    expect(screen.getByRole('button', { name: 'Start date, year: not chosen' })).toBeTruthy();
  });

  it('reorders sections by keyboard, announces each move, saves the order and resets it', async () => {
    const onSubmit = vi.fn();
    render(
      <TooltipProvider>
        <CurrentTemplateProvider template={{ key: 'senior-level-mint', name: 'Mint' }}>
          <ResumeDocumentForm defaultValues={EMPTY_RESUME_DOCUMENT} onSubmit={onSubmit} />
        </CurrentTemplateProvider>
      </TooltipProvider>,
    );
    expect(screen.getByText('Mint order:')).toBeTruthy();
    expect(screen.getByText(/Skills, Experience, Education, Projects, Recommendations/)).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Reorder sections' }));
    });
    const list = screen.getByRole('list', { name: 'Section order' });
    expect(list.querySelectorAll('[role="listitem"]')).toHaveLength(5);
    expect(screen.getByRole('button', { name: 'Move Skills, tools and languages up' }).getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByRole('button', { name: 'Reset to the Mint order' }).getAttribute('aria-disabled')).toBe('true');
    // The movable sections give way to the list; About you and Contact information stay.
    expect(screen.queryByRole('button', { name: /^Experience/ })).toBeNull();
    expect(screen.getByRole('button', { name: /^About you/ })).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Move Education up' }));
    });
    expect(screen.getByRole('status').textContent).toBe('Education moved up. Now 2 of 5.');
    expect(onSubmit).toHaveBeenLastCalledWith(
      expect.objectContaining({ sectionOrder: ['skills', 'education', 'experience', 'projects', 'recommendations'] }),
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    });
    expect(screen.getByText('Your order:')).toBeTruthy();
    const titles = [...document.querySelectorAll('section[id^="resume-section-"] h2 button')].map(
      (button) => button.id.replace('resume-section-', '').replace('-button', ''),
    );
    expect(titles).toEqual(['about', 'contact', 'highlights', 'education', 'experience', 'projects', 'recommendations']);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Reorder sections' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Reset to the Mint order' }));
    });
    expect(screen.getByRole('status').textContent).toBe('Order reset to the Mint template.');
    expect(onSubmit.mock.lastCall?.[0]).not.toHaveProperty('sectionOrder');
  });

  it('keeps a stored order as the user\'s own and resettable when it matches the template default', async () => {
    const onSubmit = vi.fn();
    render(
      <TooltipProvider>
        <CurrentTemplateProvider template={{ key: 'senior-level-mint', name: 'Mint' }}>
          <ResumeDocumentForm
            defaultValues={{
              ...EMPTY_RESUME_DOCUMENT,
              sectionOrder: ['skills', 'experience', 'education', 'projects', 'recommendations'],
            }}
            onSubmit={onSubmit}
          />
        </CurrentTemplateProvider>
      </TooltipProvider>,
    );
    expect(screen.getByText('Your order:')).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Reorder sections' }));
    });
    const reset = screen.getByRole('button', { name: 'Reset to the Mint order' });
    expect(reset.getAttribute('aria-disabled')).toBeNull();
    await act(async () => {
      fireEvent.click(reset);
    });
    expect(onSubmit.mock.lastCall?.[0]).not.toHaveProperty('sectionOrder');
  });
});
