import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ImportResumeDialog } from './import-resume-dialog';

// The modal picks a dialog or a drawer by viewport; jsdom has no matchMedia.
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

afterEach(cleanup);

function renderDialog(props: Partial<Parameters<typeof ImportResumeDialog>[0]> = {}) {
  const handlers = { onClose: vi.fn(), onImportFile: vi.fn(), onImportText: vi.fn() };
  render(<ImportResumeDialog open {...handlers} {...props} />);
  return handlers;
}

const pdf = new File(['%PDF'], 'maya-lindqvist-resume.pdf', { type: 'application/pdf' });
const importButton = () => screen.getByRole('button', { name: 'Import' });

describe('ImportResumeDialog (MDI-674)', () => {
  it('opens on Upload a PDF, with the drop zone and Import off until a file is chosen', () => {
    renderDialog();
    expect(screen.getByRole('dialog', { name: /Import your resume/ })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Upload a PDF' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tab', { name: 'Paste text' }).getAttribute('aria-selected')).toBe('false');
    expect(screen.getByRole('button', { name: 'Choose a PDF' })).toBeTruthy();
    expect(importButton().hasAttribute('disabled')).toBe(true);
  });

  it('shows the chosen PDF with Remove, and imports it only on Import', () => {
    const { onImportFile } = renderDialog();
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [pdf] } });
    expect(screen.getByText('maya-lindqvist-resume.pdf')).toBeTruthy();
    expect(screen.getByText('PDF · ready to import')).toBeTruthy();
    expect(onImportFile).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(screen.queryByText('maya-lindqvist-resume.pdf')).toBeNull();
    expect(importButton().hasAttribute('disabled')).toBe(true);

    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [pdf] } });
    fireEvent.click(importButton());
    expect(onImportFile).toHaveBeenCalledWith(pdf);
  });

  it('says next to the drop zone when a file is not a PDF, not in a toast', () => {
    renderDialog();
    const docx = new File(['x'], 'maya-resume.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    fireEvent.drop(screen.getByTestId('import-drop-zone'), { dataTransfer: { files: [docx] } });
    expect(screen.getByRole('alert').textContent).toBe('maya-resume.docx is not a PDF. Choose a PDF, or use Paste text.');
    expect(importButton().hasAttribute('disabled')).toBe(true);
  });

  it('counts pasted text against 2,000 and keeps Import off over the limit', () => {
    const { onImportText } = renderDialog();
    fireEvent.click(screen.getByRole('tab', { name: 'Paste text' }));
    const textbox = screen.getByRole('textbox', { name: 'Resume text' });

    fireEvent.change(textbox, { target: { value: 'x'.repeat(2340) } });
    expect(screen.getByText(/2,340 \/ 2,000 characters · 340 over/)).toBeTruthy();
    expect(textbox.getAttribute('aria-invalid')).toBe('true');
    expect(importButton().hasAttribute('disabled')).toBe(true);

    fireEvent.change(textbox, { target: { value: '  Ada Owner, Engineer  ' } });
    expect(screen.getByText('23 / 2,000 characters')).toBeTruthy();
    fireEvent.click(importButton());
    expect(onImportText).toHaveBeenCalledWith('Ada Owner, Engineer');
  });

  it('opens on Paste text when asked, as after a PDF could not be read', () => {
    renderDialog({ initialTab: 'paste' });
    expect(screen.getByRole('tab', { name: 'Paste text' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('textbox', { name: 'Resume text' })).toBeTruthy();
  });

  it('warns before replacing typed details and says so on the button', () => {
    renderDialog({ replaceWarning: 'You have filled in About you. The import overwrites them.' });
    expect(screen.getByTestId('import-replace-warning').textContent).toBe(
      'This replaces what you have entered. You have filled in About you. The import overwrites them.',
    );
    expect(screen.getByRole('button', { name: 'Replace and import' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Import' })).toBeNull();
  });

  it('shows no warning for an empty form', () => {
    renderDialog();
    expect(screen.queryByTestId('import-replace-warning')).toBeNull();
  });

  it('closes on Cancel without importing', () => {
    const { onClose, onImportFile, onImportText } = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onImportFile).not.toHaveBeenCalled();
    expect(onImportText).not.toHaveBeenCalled();
  });
});
