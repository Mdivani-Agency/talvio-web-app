import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MAX_PASTED_RESUME_CHARS, PasteResumeModal } from './paste-resume.modal';

// The modal picks a dialog or a drawer by viewport; jsdom has no matchMedia.
window.matchMedia ??= ((query: string) => ({
  matches: true,
  media: query,
  onchange: null,
  addListener: () => undefined,
  removeListener: () => undefined,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  dispatchEvent: () => false,
})) as typeof window.matchMedia;

function renderModal(onConfirm = vi.fn()) {
  render(<PasteResumeModal isOpen onClose={vi.fn()} onConfirm={onConfirm} />);
  return {
    onConfirm,
    textarea: screen.getByRole('textbox', { name: 'Resume text' }),
    confirm: screen.getByRole('button', { name: 'Confirm' }),
  };
}

describe('PasteResumeModal', () => {
  afterEach(() => cleanup());

  it('caps pasted text at 2,000 characters', () => {
    expect(MAX_PASTED_RESUME_CHARS).toBe(2000);
  });

  it('disables Confirm while the text is empty or only whitespace', () => {
    const { textarea, confirm } = renderModal();
    expect(confirm.hasAttribute('disabled')).toBe(true);

    fireEvent.change(textarea, { target: { value: '   \n  ' } });
    expect(confirm.hasAttribute('disabled')).toBe(true);
  });

  it('confirms text up to the limit with the trimmed value', () => {
    const { textarea, confirm, onConfirm } = renderModal();
    const text = 'a'.repeat(MAX_PASTED_RESUME_CHARS);

    fireEvent.change(textarea, { target: { value: text } });
    expect(screen.getByText('2,000 / 2,000 characters')).toBeTruthy();
    expect(confirm.hasAttribute('disabled')).toBe(false);

    fireEvent.change(textarea, { target: { value: '  Ada Owner\nEngineer  ' } });
    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledWith('Ada Owner\nEngineer');
  });

  it('shows the overflow and blocks Confirm over the limit', () => {
    const { textarea, confirm, onConfirm } = renderModal();

    fireEvent.change(textarea, { target: { value: 'a'.repeat(MAX_PASTED_RESUME_CHARS + 1) } });

    expect(screen.getByText('2,001 / 2,000 characters (1 over the limit)')).toBeTruthy();
    expect(textarea.getAttribute('aria-invalid')).toBe('true');
    expect(confirm.hasAttribute('disabled')).toBe(true);
    fireEvent.click(confirm);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
