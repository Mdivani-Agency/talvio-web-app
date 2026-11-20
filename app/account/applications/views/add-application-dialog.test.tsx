import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const fetchAllResumes = vi.fn();
vi.mock('@app/resume/query/use-resumes', () => ({ fetchAllResumes: (...args: unknown[]) => fetchAllResumes(...args) }));
vi.mock('@/lib/graphql-client', async () => {
  const actual = await vi.importActual<typeof import('@/test/mocks/graphql-client')>('@/test/mocks/graphql-client');
  return { ...actual, shouldRetryGraphqlQuery: () => false };
});

import { AddApplicationDialog } from './add-application-dialog';

function renderDialog() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AddApplicationDialog open userId="user-1" onOpenChange={() => undefined} onCreate={vi.fn()} />
    </QueryClientProvider>,
  );
}

describe('AddApplicationDialog resume picker', () => {
  afterEach(() => {
    cleanup();
    fetchAllResumes.mockReset();
  });

  it('says the resumes did not load and retries, instead of offering only "No resume"', async () => {
    fetchAllResumes.mockRejectedValue(new Error('offline'));
    renderDialog();

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain("Your resumes didn't load, so you can't pick one yet.");
    expect(screen.getByRole('combobox', { name: 'Resume sent (optional)' }).hasAttribute('disabled')).toBe(true);

    fetchAllResumes.mockResolvedValue([]);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await vi.waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    expect(screen.getByRole('combobox', { name: 'Resume sent (optional)' }).hasAttribute('disabled')).toBe(false);
  });
});
