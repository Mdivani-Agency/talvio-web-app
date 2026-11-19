import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const getDocuments = vi.fn();
vi.mock('@lib/clients/media.client', () => ({ getDocuments: (...args: unknown[]) => getDocuments(...args) }));
vi.mock('@lib/providers', () => ({ useUserSession: () => ({ session: { user: { id: 'user-1' } } }) }));
// The full-page Loading spinner is an SVG import that jsdom cannot render; a plain status stands in for it.
vi.mock('@components/views', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@components/views')>()),
  Loading: ({ message }: { message?: string }) => <p role="status">{message}</p>,
}));
vi.mock('./hooks/use-pdf-preview', () => ({ usePdfPreview: () => ({ status: 'loading' }) }));

import DocumentsPage from './page';

const item = (name: string) => ({
  key: name,
  userId: 'user-1',
  name,
  type: 'application/pdf',
  publicUrl: `https://media.example/${name}.pdf`,
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DocumentsPage />
    </QueryClientProvider>,
  );
}

describe('DocumentsPage paging', () => {
  afterEach(() => {
    cleanup();
    getDocuments.mockReset();
  });

  it('loads the next page with Load more and hides it after the last page', async () => {
    getDocuments
      .mockResolvedValueOnce({ items: [item('One'), item('Two')], nextToken: 'page-2' })
      .mockResolvedValueOnce({ items: [item('Three')], nextToken: undefined });
    renderPage();
    await waitFor(() => expect(screen.getAllByTestId('document-card')).toHaveLength(2));
    expect(getDocuments).toHaveBeenLastCalledWith('user-1', undefined);

    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
    await waitFor(() => expect(screen.getAllByTestId('document-card')).toHaveLength(3));
    expect(getDocuments).toHaveBeenLastCalledWith('user-1', 'page-2');
    expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
  });

  it('keeps the loaded files when the next page fails, and Try again continues', async () => {
    getDocuments
      .mockResolvedValueOnce({ items: [item('One'), item('Two')], nextToken: 'page-2' })
      .mockRejectedValueOnce(new Error('Could not load documents'))
      .mockResolvedValueOnce({ items: [item('Three')], nextToken: undefined });
    renderPage();
    await waitFor(() => expect(screen.getAllByTestId('document-card')).toHaveLength(2));

    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Could not load more resumes.');
    expect(screen.getAllByTestId('document-card')).toHaveLength(2);
    expect(screen.queryByText('Could not load your resumes')).toBeNull();
    expect(screen.queryByText('No resume PDFs yet')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(screen.getAllByTestId('document-card')).toHaveLength(3));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows a failed first page as the failed list, not an empty library', async () => {
    getDocuments.mockRejectedValueOnce(new Error('Could not load documents'));
    renderPage();
    expect(await screen.findByText('Could not load your resumes')).toBeTruthy();
    expect(screen.queryByText('No resume PDFs yet')).toBeNull();
  });
});
