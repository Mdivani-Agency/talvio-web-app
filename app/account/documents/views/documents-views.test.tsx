import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../resume-image', () => ({ ResumeImage: () => <span data-testid="preview" /> }));

import { DocumentGrid } from './document-grid';
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
  afterEach(cleanup);

  it('renders one card per document with Open, the date and Download', () => {
    render(<DocumentGrid documents={DOCUMENTS} />);
    const cards = screen.getAllByTestId('document-card');
    expect(cards).toHaveLength(2);

    const first = within(cards[0]);
    expect(first.getByRole('link', { name: 'Open Library resume' }).getAttribute('href')).toBe(DOCUMENTS[0].publicUrl);
    expect(first.getByText('Library resume.pdf')).toBeTruthy();
    expect(first.getByText('Added Nov 6, 2026')).toBeTruthy();
    const download = first.getByRole('link', { name: 'Download Library resume' });
    expect(download.getAttribute('href')).toBe(DOCUMENTS[0].publicUrl);
    expect(download.getAttribute('target')).toBe('_blank');

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
});
