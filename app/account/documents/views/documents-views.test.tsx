import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const preview = vi.hoisted(() => ({ current: { status: 'loading' } as import('../hooks/use-pdf-preview').PdfPreview }));
vi.mock('../hooks/use-pdf-preview', () => ({ usePdfPreview: () => preview.current }));
const pdf = vi.hoisted(() => ({ download: vi.fn(), open: vi.fn() }));
vi.mock('@/lib/pdf/pdf-actions', () => ({ downloadPdf: pdf.download, openPdfInTab: pdf.open }));

import { DocumentGrid } from './document-grid';
import { DocumentPreview } from './document-preview';
import { DocumentsPanel } from './documents-panel';

const DOCUMENTS = [
  {
    key: 'a',
    userId: 'u',
    name: 'Library resume',
    type: 'application/pdf',
    publicUrl: 'https://media.example/a.pdf',
    createdAt: '2026-11-06T10:00:00.000Z',
  },
  { key: 'b', userId: 'u', name: 'Short', type: 'application/pdf', publicUrl: 'https://media.example/b.pdf' },
];

describe('documents views', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    preview.current = { status: 'loading' };
  });

  it('renders one card per document with Open, the date and Download', () => {
    render(<DocumentGrid documents={DOCUMENTS} />);
    const cards = screen.getAllByTestId('document-card');
    expect(cards).toHaveLength(2);
    // Each list item renders the shared Card (AGENTS.md: list items use Card from @components/ui).
    for (const card of cards) {
      expect(card.querySelector('[data-slot="card"]')).not.toBeNull();
    }

    const first = within(cards[0]);
    const file = { url: DOCUMENTS[0].publicUrl, name: 'Library resume.pdf' };
    // Buttons, not links: a link to the stored attachment would download on Open and lose the name on Download.
    expect(first.queryAllByRole('link', { name: /Library resume$/ })).toEqual([]);
    fireEvent.click(first.getByRole('button', { name: 'Open Library resume' }));
    expect(pdf.open).toHaveBeenCalledWith(file);
    expect(first.getByText('Library resume.pdf')).toBeTruthy();
    expect(first.getByText('Added Nov 6, 2026')).toBeTruthy();
    const downloads = first.getAllByRole('button', { name: 'Download Library resume' });
    expect(downloads).toHaveLength(2);
    for (const download of downloads) {
      fireEvent.click(download);
    }
    expect(pdf.download).toHaveBeenCalledTimes(2);
    expect(pdf.download).toHaveBeenCalledWith(file);

    // No date from the media service: the card says "PDF".
    expect(within(cards[1]).getByText('PDF')).toBeTruthy();
  });

  it('shows the empty library with Create resume', () => {
    render(<DocumentsPanel kind="empty" />);
    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'No resume PDFs yet' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Create resume' }).getAttribute('href')).toBe('/resume');
  });

  it('shows a failed list as an alert with Try again and no Create resume', () => {
    const onRetry = vi.fn();
    render(<DocumentsPanel kind="error" onRetry={onRetry} />);
    expect(within(screen.getByRole('alert')).getByRole('heading', { name: 'Could not load your resumes' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Create resume' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('shows the loading and failed preview states, and Download still works when the preview fails', () => {
    render(<DocumentGrid documents={[DOCUMENTS[0]]} />);
    expect(screen.getByRole('status').textContent).toBe('Loading preview');
    cleanup();

    preview.current = { status: 'failed' };
    render(<DocumentGrid documents={[DOCUMENTS[0]]} />);
    expect(screen.getByText('Preview not available')).toBeTruthy();
    // The desktop button and the phone icon button both download; CSS shows one of them per breakpoint.
    const downloads = screen.getAllByRole('button', { name: 'Download Library resume' });
    expect(downloads).toHaveLength(2);
    fireEvent.click(downloads[0]!);
    expect(pdf.download).toHaveBeenCalledWith({ url: DOCUMENTS[0].publicUrl, name: 'Library resume.pdf' });
  });

  it('names the first page on the card and keeps the phone thumbnail decorative', () => {
    preview.current = { status: 'ready', src: 'data:image/png;base64,AAA' };
    render(<DocumentGrid documents={[DOCUMENTS[0]]} />);
    expect(screen.getByRole('img', { name: 'First page of Library resume' })).toBeTruthy();
    // The phone thumbnail sits in an aria-hidden wrapper with an empty alt.
    const images = document.querySelectorAll('img');
    expect(images).toHaveLength(2);
    expect([...images].filter((image) => image.getAttribute('alt') === '')).toHaveLength(1);
  });

  it('shows nothing in a compact thumbnail until the image is ready', () => {
    const { container } = render(<DocumentPreview preview={{ status: 'failed' }} alt="" compact />);
    expect(container.innerHTML).toBe('');
  });
});
