import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { LegalContents } from './legal-contents';

const ITEMS = [
  { id: 'section-1', heading: '1. Who we are' },
  { id: 'section-2', heading: '2. Agreeing to these terms' },
];

describe('LegalContents', () => {
  // Vitest runs without globals here, so Testing Library cannot clean up between tests on its own.
  afterEach(cleanup);

  it('opens On this page on demand and closes it when a section is chosen', () => {
    render(<LegalContents items={ITEMS} />);
    const toggle = screen.getByRole('button', { name: 'On this page' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    // Only the desktop list is in the DOM while the disclosure is closed.
    expect(screen.getAllByRole('navigation', { name: 'On this page', hidden: true })).toHaveLength(1);

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const lists = screen.getAllByRole('navigation', { name: 'On this page', hidden: true });
    expect(lists).toHaveLength(2);
    const phoneList = lists.find((list) => list.id === toggle.getAttribute('aria-controls'));
    expect(phoneList).toBeDefined();
    const link = within(phoneList!).getByRole('link', { name: '2. Agreeing to these terms' });
    expect(link.getAttribute('href')).toBe('#section-2');

    fireEvent.click(link);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('marks the chosen section as the current location', () => {
    render(<LegalContents items={ITEMS} />);
    const desktop = screen.getByRole('navigation', { name: 'On this page', hidden: true });
    const first = within(desktop).getByRole('link', { name: '1. Who we are', hidden: true });
    const second = within(desktop).getByRole('link', { name: '2. Agreeing to these terms', hidden: true });
    expect(first.getAttribute('aria-current')).toBe('location');

    fireEvent.click(second);
    expect(second.getAttribute('aria-current')).toBe('location');
    expect(first.getAttribute('aria-current')).toBeNull();
  });
});
