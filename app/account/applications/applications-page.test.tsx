import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mockGraphqlSdk } from '@/test/mocks/graphql-client';

const replace = vi.fn();
let search = '';
let desktop = true;

vi.mock('@/lib/graphql-client', async () => {
  const actual = await vi.importActual<typeof import('@/test/mocks/graphql-client')>('@/test/mocks/graphql-client');
  return { ...actual, shouldRetryGraphqlQuery: () => false };
});
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/account/applications',
  useSearchParams: () => new URLSearchParams(search),
}));
vi.mock('usehooks-ts', () => ({ useMediaQuery: () => desktop }));
vi.mock('@lib/providers', () => ({ useUserSession: () => ({ session: { user: { id: 'user-1' } } }) }));
// The full-page Loading spinner is an SVG import that jsdom cannot render; a plain status stands in for it.
vi.mock('@components/views', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@components/views')>()),
  Loading: ({ message }: { message?: string }) => <p role="status">{message}</p>,
}));

import ApplicationsPage from './applications-page';

function row(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    user_id: 'user-1',
    position: `Role ${id}`,
    company: `Company ${id}`,
    stage: 'saved',
    sort_order: 0,
    location: null,
    salary: null,
    contact: null,
    applied_on: null,
    next_step_on: null,
    next_step: null,
    resume_id: null,
    labels: '[]',
    links: '[]',
    stage_changed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function respond(rows: ReturnType<typeof row>[]) {
  mockGraphqlSdk.ApplicationsByUser = vi.fn().mockResolvedValue({
    job_applicationsCollection: { edges: rows.map((node) => ({ node })), pageInfo: { hasNextPage: false, endCursor: null } },
  });
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ApplicationsPage />
    </QueryClientProvider>,
  );
}

describe('ApplicationsPage', () => {
  beforeEach(() => {
    search = '';
    desktop = true;
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows a failed load as an error with Try again, never as an empty board', async () => {
    mockGraphqlSdk.ApplicationsByUser = vi.fn().mockRejectedValue(new Error('offline'));
    renderPage();

    expect(await screen.findByRole('heading', { name: "Your applications didn't load" })).toBeTruthy();
    expect(screen.queryByText('Keep track of every application')).toBeNull();

    respond([]);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'Keep track of every application' })).toBeTruthy();
    expect(screen.getByText('Nothing tracked yet')).toBeTruthy();
  });

  it('shows five columns with counts, the summary and the label chips', async () => {
    respond([
      row('a', { stage: 'applied', labels: JSON.stringify([{ name: 'Remote', color: 'green' }]) }),
      row('b', { stage: 'rejected' }),
    ]);
    renderPage();

    expect(await screen.findByText('2 applications · 1 active')).toBeTruthy();
    for (const column of ['saved', 'applied', 'interview', 'offer', 'closed']) {
      expect(screen.getByTestId(`column-${column}`)).toBeTruthy();
    }
    expect(within(screen.getByTestId('column-closed')).getByText('Rejected')).toBeTruthy();
    expect(within(screen.getByTestId('column-saved')).getByText('Jobs you want to apply to')).toBeTruthy();

    fireEvent.click(within(screen.getByRole('group', { name: 'Filter by label' })).getByRole('button', { name: 'Remote' }));
    expect(replace).toHaveBeenCalledWith('/account/applications?labels=Remote', { scroll: false });
  });

  it('filters by the labels in the URL and ignores labels no card carries', async () => {
    search = 'labels=Remote&labels=Gone';
    respond([row('a', { labels: JSON.stringify([{ name: 'Remote', color: 'green' }]) }), row('b')]);
    renderPage();

    expect(await screen.findByText('Showing 1 of 2 applications')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Role b' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Remote' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('shows stage tabs instead of the board on a phone', async () => {
    desktop = false;
    respond([row('a', { stage: 'applied' })]);
    renderPage();

    const tab = await screen.findByRole('tab', { name: 'Applied 1' });
    expect(tab.getAttribute('aria-selected')).toBe('true');
    expect(screen.queryByTestId('column-applied')).toBeNull();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Role a' })).toBeTruthy());
  });
});
