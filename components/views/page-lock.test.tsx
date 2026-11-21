import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PageLock, type PageLockProps } from './page-lock';

const BASE: PageLockProps = {
  context: 'Generate PDF',
  title: 'Making your PDF',
  steps: ['Building the PDF', 'Starting your download'],
  currentStep: 0,
  note: 'Keep this tab open until your download starts.',
  slowNote: 'Building the PDF is taking longer than usual.',
};

function setOnline(online: boolean) {
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => online });
  window.dispatchEvent(new Event(online ? 'online' : 'offline'));
}

function renderInApp(props: PageLockProps) {
  const app = document.createElement('div');
  app.id = 'app';
  const trigger = document.createElement('button');
  trigger.textContent = 'Generate PDF';
  app.appendChild(trigger);
  document.body.appendChild(app);
  trigger.focus();
  const view = render(<PageLock {...props} />);
  return { app, trigger, ...view };
}

describe('PageLock', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    setOnline(true);
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  it('makes the app inert, focuses the heading and gives everything back when it ends', () => {
    const { app, trigger, unmount } = renderInApp(BASE);
    const heading = screen.getByRole('heading', { name: 'Making your PDF' });
    expect(document.activeElement).toBe(heading);
    expect(app.hasAttribute('inert')).toBe(true);
    expect(screen.getByRole('dialog', { name: 'Making your PDF' }).getAttribute('aria-modal')).toBe('true');
    // The card itself is not inert.
    expect(screen.getByTestId('page-lock').closest('[inert]')).toBeNull();

    unmount();
    expect(app.hasAttribute('inert')).toBe(false);
    expect(document.activeElement).toBe(trigger);
    expect(document.querySelector('[data-page-lock]')).toBeNull();
  });

  it('leaves alone what was already inert', () => {
    const other = document.createElement('div');
    other.setAttribute('inert', '');
    document.body.appendChild(other);
    const { unmount } = renderInApp(BASE);
    unmount();
    expect(other.hasAttribute('inert')).toBe(true);
  });

  it('shows steps as done, in progress and not started in a polite live region', () => {
    render(<PageLock {...BASE} steps={['One', 'Two', 'Three']} currentStep={1} />);
    const list = screen.getByRole('status');
    expect(list.tagName).toBe('OL');
    expect(list.getAttribute('aria-live')).toBe('polite');
    const items = screen.getAllByRole('listitem');
    expect(items.map((item) => item.getAttribute('data-state'))).toEqual(['done', 'active', 'todo']);
    expect(items[0].textContent).toBe('One (done)');
    expect(items[1].textContent).toBe('Two (in progress)');
    expect(items[2].textContent).toBe('Three');
  });

  it('shows one line without steps or time for short work', () => {
    render(<PageLock context="Save profile" title="Saving your profile" line="Saving your details" note="Keep this tab open." />);
    expect(screen.getByRole('status').textContent).toBe('Saving your details');
    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.queryByLabelText('Time so far')).toBeNull();
  });

  it('counts the time so far and adds Still working after one minute', () => {
    render(<PageLock {...BASE} />);
    expect(screen.getByLabelText('Time so far').textContent).toBe('0:00');
    act(() => {
      vi.advanceTimersByTime(59_000);
    });
    expect(screen.getByLabelText('Time so far').textContent).toBe('0:59');
    expect(screen.queryByText('Still working.')).toBeNull();
    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(screen.getByLabelText('Time so far').textContent).toBe('1:00');
    expect(screen.getByText('Still working.').parentElement?.textContent).toBe(
      'Still working. Building the PDF is taking longer than usual.',
    );
  });

  it('keeps counting from when a restored job started', () => {
    render(<PageLock {...BASE} startedAt={Date.now() - 72_000} />);
    expect(screen.getByLabelText('Time so far').textContent).toBe('1:12');
    expect(screen.getByText('Still working.')).toBeTruthy();
  });

  it('pauses the current step while offline, when the work can wait for a connection', () => {
    render(<PageLock {...BASE} currentStep={1} offlineNote="Paused, not lost." />);
    act(() => setOnline(false));
    expect(screen.getByRole('heading', { name: 'Waiting for a connection' })).toBeTruthy();
    expect(screen.getAllByRole('listitem').map((item) => item.getAttribute('data-state'))).toEqual(['done', 'paused']);
    expect(screen.getAllByRole('listitem')[1].textContent).toBe('Starting your download (paused)');
    expect(screen.getByText('Paused, not lost.')).toBeTruthy();
    act(() => setOnline(true));
    expect(screen.getByRole('heading', { name: 'Making your PDF' })).toBeTruthy();
  });

  it('ignores the connection for work without an offline note', () => {
    render(<PageLock {...BASE} />);
    act(() => setOnline(false));
    expect(screen.getByRole('heading', { name: 'Making your PDF' })).toBeTruthy();
  });

  it('offers Cancel only when given', () => {
    const onCancel = vi.fn();
    const { rerender } = render(<PageLock {...BASE} />);
    expect(screen.queryByRole('button')).toBeNull();
    rerender(<PageLock {...BASE} cancel={{ label: 'Cancel', onClick: onCancel }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows a failure in the same card with what was kept and two actions', () => {
    const primary = vi.fn();
    const secondary = vi.fn();
    const { rerender } = render(<PageLock {...BASE} cancel={{ label: 'Cancel', onClick: vi.fn() }} />);
    rerender(
      <PageLock
        {...BASE}
        cancel={{ label: 'Cancel', onClick: vi.fn() }}
        failure={{
          title: 'Your PDF wasn’t made',
          body: 'The PDF service did not answer.',
          kept: 'Your changes are saved.',
          primary: { label: 'Try again', onClick: primary },
          secondary: { label: 'Back to the editor', onClick: secondary },
        }}
      />,
    );
    const heading = screen.getByRole('heading', { name: 'Your PDF wasn’t made' });
    expect(document.activeElement).toBe(heading);
    expect(screen.getByRole('alert').textContent).toBe('The PDF service did not answer.');
    expect(screen.getByText('Your changes are saved.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
    expect(screen.queryByLabelText('Time so far')).toBeNull();
    expect(screen.getByRole('dialog').getAttribute('aria-busy')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back to the editor' }));
    expect(primary).toHaveBeenCalledTimes(1);
    expect(secondary).toHaveBeenCalledTimes(1);
  });

  it('scrolls when the card is taller than the screen, so Cancel stays reachable (PR #198 review)', () => {
    render(<PageLock {...BASE} cancel={{ label: 'Cancel', onClick: vi.fn() }} />);
    const overlay = screen.getByTestId('page-lock');
    expect(overlay.className).toContain('overflow-y-auto');
    // Centred by a wrapper at least as tall as the overlay, not by the overlay itself, so the top never clips.
    expect(overlay.className).not.toContain('items-center');
    expect(screen.getByRole('dialog').parentElement?.className).toContain('min-h-full');
  });

  it('does nothing on Escape', () => {
    render(<PageLock {...BASE} />);
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('asks before the tab closes only when told to', () => {
    const ask = () => {
      const event = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    };
    const { rerender, unmount } = render(<PageLock {...BASE} />);
    expect(ask()).toBe(false);
    rerender(<PageLock {...BASE} warnOnLeave />);
    expect(ask()).toBe(true);
    unmount();
    expect(ask()).toBe(false);
  });
});
