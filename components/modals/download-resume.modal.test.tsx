import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { allowanceStatus } from '@/lib/allowance';

import { DownloadResumeModal } from './download-resume.modal';

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

const NOW = new Date('2026-10-06T12:00:00Z');

function renderModal(props: Partial<Parameters<typeof DownloadResumeModal>[0]> = {}) {
  render(
    <DownloadResumeModal
      isOpen
      filename="Ada Owner"
      isGenerating={false}
      setFilename={vi.fn()}
      generateResume={vi.fn()}
      onClose={vi.fn()}
      {...props}
    />,
  );
  return screen.getByRole('dialog');
}

describe('DownloadResumeModal', () => {
  afterEach(() => cleanup());

  it('counts the PDFs left before generating', () => {
    const dialog = renderModal({ allowance: allowanceStatus(60, NOW) });

    expect(dialog.textContent).toContain('uses 1 of your monthly resume PDFs. You have 2 of 3 left this month.');
    expect(screen.getByRole('button', { name: 'Generate and Download Resume' }).hasAttribute('disabled')).toBe(false);
  });

  it('blocks generating at zero and names the renewal date', () => {
    const dialog = renderModal({ allowance: allowanceStatus(0, NOW) });

    expect(dialog.textContent).toContain('No new resume PDFs left this month. You get 3 more on 1 November.');
    expect(screen.getByRole('button', { name: 'Generate and Download Resume' }).hasAttribute('disabled')).toBe(true);
  });

  it('keeps re-downloading a generated PDF available at zero', () => {
    renderModal({ allowance: allowanceStatus(0, NOW), isFreeDownload: true });

    expect(screen.getByRole('button', { name: 'Download Resume' }).hasAttribute('disabled')).toBe(false);
  });

  it('does not block a guest, whose allowance is unknown', () => {
    const dialog = renderModal();

    expect(dialog.textContent).not.toContain('left this month');
    expect(screen.getByRole('button', { name: 'Generate and Download Resume' }).hasAttribute('disabled')).toBe(false);
  });

  it('mentions no credits', () => {
    const dialog = renderModal({ allowance: allowanceStatus(30, NOW) });

    expect(dialog.textContent).not.toMatch(/credit/i);
  });
});
