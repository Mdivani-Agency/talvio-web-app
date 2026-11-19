import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Vitest does not transform the SVG icon imports that the FAQ chevron uses.
vi.mock('@components/icons', () => ({ Icon: () => <svg aria-hidden="true" /> }));

import PricingPage from './page';

afterEach(cleanup);

describe('PricingPage', () => {
  it('shows the hero and the four plans, with Coming soon instead of a payment control', () => {
    render(<PricingPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Start free. Upgrade when you apply more.' })).toBeTruthy();
    for (const name of ['Free', 'Pro', 'Max', 'Ultra']) {
      expect(screen.getByRole('heading', { level: 3, name })).toBeTruthy();
    }
    const plans = screen.getByRole('region', { name: 'Plans' });
    expect(within(plans).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(['/auth/sign-in']);
    expect(within(plans).queryAllByRole('button')).toHaveLength(0);
    const comingSoon = within(plans).getAllByText('Coming soon');
    expect(comingSoon).toHaveLength(3);
    for (const item of comingSoon) {
      expect(item.closest('[aria-disabled="true"]')).toBeTruthy();
      expect(item.closest('a, button, [tabindex]')).toBeNull();
    }
    expect(within(plans).getByText('Recommended')).toBeTruthy();
    expect(screen.getByText('Subscriptions are not available yet. Nothing on this page starts a payment.')).toBeTruthy();
  });

  it('explains what counts, answers the questions in native disclosures, and ends with the two actions', () => {
    const { container } = render(<PricingPage />);
    expect(screen.getByRole('heading', { level: 2, name: 'What counts as a new PDF' })).toBeTruthy();
    expect(screen.getByText('A failed attempt')).toBeTruthy();
    const details = container.querySelectorAll('details');
    expect(details).toHaveLength(8);
    expect(details[0].open).toBe(true);
    expect(screen.getByRole('link', { name: 'terms of service' }).getAttribute('href')).toBe('/terms');
    expect(screen.getByRole('link', { name: 'contact@talvio.co' }).getAttribute('href')).toBe('mailto:contact@talvio.co');
    const closing = screen.getByRole('region', { name: 'Download your first resume PDF' });
    expect(within(closing).getByRole('link', { name: 'Start free' }).getAttribute('href')).toBe('/auth/sign-in');
    expect(within(closing).getByRole('link', { name: 'See templates' }).getAttribute('href')).toBe('/templates');
  });

  it('has no credit wording', () => {
    const { container } = render(<PricingPage />);
    expect(container.textContent).not.toMatch(/credit/i);
  });
});
