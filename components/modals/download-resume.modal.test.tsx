import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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
    expect(screen.getByRole('button', { name: 'Generate PDF' }).hasAttribute('disabled')).toBe(false);
  });

  it('blocks generating at zero and names the renewal date', () => {
    const dialog = renderModal({ allowance: allowanceStatus(0, NOW) });

    expect(dialog.textContent).toContain('No new resume PDFs left this month. You get 3 more on 1 November.');
    expect(screen.getByRole('button', { name: 'Generate PDF' }).hasAttribute('disabled')).toBe(true);
  });

  it('keeps re-downloading a generated PDF available at zero', () => {
    renderModal({ allowance: allowanceStatus(0, NOW), isFreeDownload: true });

    expect(screen.getByRole('button', { name: /^Download$/ }).hasAttribute('disabled')).toBe(false);
  });

  it('does not block a guest, whose allowance is unknown', () => {
    const dialog = renderModal();

    expect(dialog.textContent).not.toContain('left this month');
    expect(screen.getByRole('button', { name: 'Generate PDF' }).hasAttribute('disabled')).toBe(false);
  });

  it('mentions no credits', () => {
    const dialog = renderModal({ allowance: allowanceStatus(30, NOW) });

    expect(dialog.textContent).not.toMatch(/credit/i);
  });

  it('offers Improve with AI first only when the editor passes onImprove', () => {
    renderModal();
    expect(screen.queryByRole('button', { name: 'Improve with AI first' })).toBeNull();
    cleanup();

    const onImprove = vi.fn();
    renderModal({ onImprove });
    fireEvent.click(screen.getByRole('button', { name: 'Improve with AI first' }));
    expect(onImprove).toHaveBeenCalledTimes(1);
  });

  it('stays disabled while a PDF is being generated', () => {
    renderModal({ allowance: allowanceStatus(60, NOW), isGenerating: true });

    expect(screen.getByRole('button', { name: 'Generate PDF' }).hasAttribute('disabled')).toBe(true);
  });

  it('labels the file name and the label, explains the label and offers Cancel', () => {
    const onClose = vi.fn();
    renderModal({ label: '', setLabel: vi.fn(), onClose });
    expect(screen.getByRole('dialog', { name: /Generate your PDF/ })).toBeTruthy();
    expect((screen.getByLabelText('File name') as HTMLInputElement).value).toBe('Ada Owner');
    expect(screen.getByLabelText('Label (optional)').getAttribute('aria-describedby')).toBeTruthy();
    expect(screen.getByText('Only you see it, in your documents list.')).toBeTruthy();
    expect(screen.getByText('Re-downloads of a generated PDF are always free.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('offers Download and Open in new tab once the PDF is ready, each as its own click', () => {
    const onDownload = vi.fn();
    const onOpen = vi.fn();
    const onClose = vi.fn();
    const dialog = renderModal({ onClose, ready: { name: 'Ada Owner', onDownload, onOpen } });

    expect(dialog.textContent).toContain('Your PDF is ready');
    expect(dialog.textContent).toContain('Ada Owner.pdf is saved in your account.');
    expect(screen.queryByLabelText('File name')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Generate PDF' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open in new tab' }));
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(onDownload).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalled();
  });
});
