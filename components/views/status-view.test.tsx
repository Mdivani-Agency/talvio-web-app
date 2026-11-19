import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { FileX } from 'lucide-react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ErrorView } from './error-view';
import { StatusView } from './status-view';

afterEach(cleanup);

describe('StatusView', () => {
  it('shows a code, a heading, the line, link actions and the extra links', () => {
    render(
      <StatusView
        as="main"
        code="404"
        title="Missing"
        body="Gone."
        primary={{ label: 'Home', href: '/' }}
        secondary={{ label: 'Templates', href: '/templates' }}
        links={{ label: 'Popular pages', intro: 'Or try:', items: [{ name: 'Blog', href: '/blog' }] }}
      />,
    );
    expect(screen.getByRole('main')).toBeTruthy();
    expect(screen.getByText('404')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1, name: 'Missing' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('href')).toBe('/');
    expect(screen.getByRole('link', { name: 'Templates' }).getAttribute('href')).toBe('/templates');
    const nav = screen.getByRole('navigation', { name: 'Popular pages' });
    expect(nav.textContent).toContain('Or try:');
    expect(screen.getByRole('link', { name: 'Blog' }).getAttribute('href')).toBe('/blog');
    expect(screen.queryByText(/If it keeps happening/)).toBeNull();
  });

  it('shows a decorative icon tile instead of a code, button actions and the support email', () => {
    const onClick = vi.fn();
    const { container } = render(
      <StatusView icon={FileX} title="Oops" body="Broke." primary={{ label: 'Retry', onClick }} help />,
    );
    expect(container.querySelector('[aria-hidden="true"] svg')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByRole('link', { name: 'contact@talvio.co' }).getAttribute('href')).toBe('mailto:contact@talvio.co');
  });
});

describe('ErrorView', () => {
  it('shows the default text with Go to the homepage when there is nothing to retry', () => {
    render(<ErrorView />);
    expect(screen.getByRole('heading', { name: "This page didn't load" })).toBeTruthy();
    expect(screen.getByText(/Your saved work is safe/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Go to the homepage' }).getAttribute('href')).toBe('/');
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
    expect(screen.getByRole('link', { name: 'contact@talvio.co' })).toBeTruthy();
  });

  it("keeps a caller's own text and calls reset from Try again", () => {
    const reset = vi.fn();
    render(<ErrorView title="Could not load your profile" body="The profile lookup failed." reset={reset} />);
    expect(screen.getByRole('heading', { name: 'Could not load your profile' })).toBeTruthy();
    expect(screen.getByText('The profile lookup failed.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(reset).toHaveBeenCalledOnce();
    expect(screen.getByRole('link', { name: 'Go to the homepage' })).toBeTruthy();
  });
});
