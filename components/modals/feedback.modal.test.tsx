import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { TRUSTPILOT_REVIEW_URL } from '@/lib/feedback-copy';

import { FeedbackModal, type FeedbackModalProps } from './feedback.modal';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

beforeAll(() => {
  // Desktop: the modal is a dialog. jsdom has no matchMedia.
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
});

function renderModal(props: Partial<FeedbackModalProps> = {}) {
  const handlers = {
    onClose: vi.fn(),
    onTrustpilot: vi.fn(),
    onSubmit: vi.fn().mockResolvedValue(true),
    ...props,
  };
  render(<FeedbackModal open {...handlers} />);
  return handlers;
}

describe('FeedbackModal', () => {
  afterEach(() => cleanup());

  it('asks every user the same thing: Trustpilot, what went wrong, or not now', () => {
    renderModal();

    const dialog = screen.getByRole('dialog', { name: 'How did it go? Review Talvio on Trustpilot' });
    expect(dialog.textContent).toContain('Your PDF is downloading');
    expect(dialog.textContent).toContain('Say it as it was, good or bad.');
    const link = screen.getByRole('link', { name: /Write a review on Trustpilot/ });
    expect(link.getAttribute('href')).toBe(TRUSTPILOT_REVIEW_URL);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(screen.getByRole('button', { name: 'Tell us what went wrong' }).getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByRole('button', { name: 'Not now' })).toBeTruthy();
    expect(dialog.textContent).not.toMatch(/star|rating/i);
  });

  it('records the Trustpilot click and closes', () => {
    const { onTrustpilot, onClose } = renderModal();

    fireEvent.click(screen.getByRole('link', { name: /Write a review on Trustpilot/ }));

    expect(onTrustpilot).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Not now, the close button and Escape', () => {
    const { onClose } = renderModal();

    fireEvent.click(screen.getByRole('button', { name: 'Not now' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('opens the form in place with focus in it and keeps the Trustpilot link above', () => {
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: 'Tell us what went wrong' }));

    const field = screen.getByRole('textbox', { name: 'Tell us what went wrong' });
    expect(document.activeElement).toBe(field);
    expect(field.getAttribute('maxlength')).toBe('2000');
    expect(screen.getByRole('link', { name: /Write a review on Trustpilot/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Tell us what went wrong' })).toBeNull();
    expect(screen.getByText(/This goes to the Talvio team only/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getByRole('button', { name: 'Tell us what went wrong' })).toBeTruthy();
  });

  it('does not send an empty message', async () => {
    const { onSubmit } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Tell us what went wrong' }));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Send to Talvio' }));
    });

    await waitFor(() => expect(screen.getByText('Write a few words about what went wrong')).toBeTruthy());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('sends the message, then thanks the user and still offers Trustpilot', async () => {
    const { onSubmit, onClose } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Tell us what went wrong' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'The PDF cut off my last job.' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Send to Talvio' }));
    });

    expect(onSubmit).toHaveBeenCalledWith('The PDF cut off my last job.');
    const thanks = await screen.findByRole('dialog', { name: 'Thanks for telling us' });
    expect(thanks.textContent).toContain('You can still review us publicly');
    expect(screen.getByRole('link', { name: /Write a review on Trustpilot/ })).toBeTruthy();
    const done = screen.getByRole('button', { name: 'Done' });
    expect(document.activeElement).toBe(done);
    fireEvent.click(done);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('stays on the form when the message was not stored', async () => {
    renderModal({ onSubmit: vi.fn().mockResolvedValue(false) });
    fireEvent.click(screen.getByRole('button', { name: 'Tell us what went wrong' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Hello' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Send to Talvio' }));
    });

    expect(screen.queryByRole('dialog', { name: 'Thanks for telling us' })).toBeNull();
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('Hello');
  });
});
