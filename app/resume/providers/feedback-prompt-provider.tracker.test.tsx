import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  due: vi.fn(),
  record: vi.fn(),
  cards: vi.fn(),
  create: vi.fn(),
  toast: vi.fn(),
  pathname: '/resume/resume-1',
}));

vi.mock('next/navigation', () => ({ usePathname: () => mocks.pathname }));

vi.mock('@lib/providers', () => ({ useUserSession: () => ({ session: { user: { id: 'user-1' } } }) }));
vi.mock('@lib/flags', () => ({ featureFlags: () => ({ feedbackPrompt: true, applicationTracker: true }) }));
vi.mock('@app/resume/query/use-feedback-prompt', () => ({
  fetchFeedbackPromptDue: mocks.due,
  feedbackPromptDueKey: (userId?: string) => ['feedback-prompt-due', userId],
}));
vi.mock('@app/resume/query/use-record-feedback-prompt', () => ({ recordFeedbackPrompt: mocks.record }));
vi.mock('@app/resume/query/use-record-trustpilot-click', () => ({ recordTrustpilotClick: vi.fn() }));
vi.mock('@app/resume/query/use-submit-feedback', () => ({ submitFeedback: vi.fn() }));
vi.mock('@app/account/applications/query/use-resume-cards', () => ({ fetchCardsForResumes: mocks.cards }));
vi.mock('@app/account/applications/query/use-resume-options', () => ({
  useResumeOptions: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }),
}));
vi.mock('@app/account/applications/query/use-create-application', () => ({
  useCreateApplication: () => ({ mutateAsync: mocks.create }),
}));
vi.mock('@app/account/applications/query/use-applications', () => ({ fetchAllApplications: async () => [] }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: mocks.toast } }));

import { FeedbackPromptProvider, useFeedbackPrompt } from './feedback-prompt-provider';

beforeAll(() => {
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

const probe: { current: ReturnType<typeof useFeedbackPrompt> | null } = { current: null };

function Probe() {
  const value = useFeedbackPrompt();
  useEffect(() => {
    probe.current = value;
  }, [value]);
  return null;
}

function renderProvider() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <FeedbackPromptProvider>
        <Probe />
      </FeedbackPromptProvider>
    </QueryClientProvider>,
  );
}

async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

const BAR = { name: 'Applying with this resume?' };
const REVIEW = { name: 'How did it go? Review Talvio on Trustpilot' };

describe('post-generate prompts in FeedbackPromptProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mocks.due.mockReset().mockResolvedValue('due');
    mocks.record.mockReset().mockResolvedValue(true);
    mocks.cards.mockReset().mockResolvedValue({});
    mocks.create.mockReset().mockResolvedValue({ id: 'card-1' });
    mocks.toast.mockReset();
    mocks.pathname = '/resume/resume-1';
  });
  afterEach(() => cleanup());

  it('shows only the tracker bar when both are due, and neither checks nor records the review prompt', async () => {
    renderProvider();
    act(() => probe.current?.notifyNewPdf({ id: 'resume-1', sourceResumeId: 'original-1' }));

    expect(await screen.findByRole('status', BAR)).toBeTruthy();
    expect(mocks.cards).toHaveBeenCalledWith(['resume-1', 'original-1']);
    expect(mocks.due).not.toHaveBeenCalled();
    expect(mocks.record).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog', REVIEW)).toBeNull();
  });

  it('shows the review prompt instead when the resume is already on a card', async () => {
    mocks.cards.mockResolvedValue({ 'original-1': 'card-1' });
    renderProvider();
    act(() => probe.current?.notifyNewPdf({ id: 'resume-1', sourceResumeId: 'original-1' }));

    expect(await screen.findByRole('dialog', REVIEW)).toBeTruthy();
    expect(screen.queryByRole('status', BAR)).toBeNull();
  });

  it('remembers a dismissal for that resume, and the next generation can show the review prompt', async () => {
    renderProvider();
    act(() => probe.current?.notifyNewPdf({ id: 'resume-1', sourceResumeId: null }));
    fireEvent.click(await screen.findByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByRole('status', BAR)).toBeNull();

    act(() => probe.current?.notifyNewPdf({ id: 'resume-1', sourceResumeId: null }));
    expect(await screen.findByRole('dialog', REVIEW)).toBeTruthy();
    expect(mocks.cards).toHaveBeenCalledTimes(1);
  });

  it('waits for the Generate dialog to close before showing the bar', async () => {
    renderProvider();
    act(() => probe.current?.setGenerateDialogOpen(true));
    act(() => probe.current?.notifyNewPdf({ id: 'resume-1', sourceResumeId: null }));
    await settle();
    expect(screen.queryByRole('status', BAR)).toBeNull();

    act(() => probe.current?.setGenerateDialogOpen(false));
    expect(await screen.findByRole('status', BAR)).toBeTruthy();
  });

  it('opens Add an application from the bar with Applied set', async () => {
    renderProvider();
    act(() => probe.current?.notifyNewPdf({ id: 'resume-1', sourceResumeId: null }));
    fireEvent.click(await screen.findByRole('button', { name: 'Add to tracker' }));

    const dialog = await screen.findByRole('dialog', { name: 'Add an application' });
    expect(dialog.textContent).toContain('Applied');
    expect(screen.queryByRole('status', BAR)).toBeNull();
  });

  async function addFromBar() {
    act(() => probe.current?.notifyNewPdf({ id: 'resume-1', sourceResumeId: null }));
    fireEvent.click(await screen.findByRole('button', { name: 'Add to tracker' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add an application' });
    fireEvent.change(screen.getByLabelText('Position'), { target: { value: 'Staff Engineer' } });
    fireEvent.change(screen.getByLabelText('Company'), { target: { value: 'Northwind' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add application' }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
    return dialog;
  }

  it('asks for the review once Add to tracker saved the card, and shows the toast when the prompt closes', async () => {
    renderProvider();
    await addFromBar();

    const review = await screen.findByRole('dialog', REVIEW);
    expect(mocks.record).toHaveBeenCalledTimes(1);
    expect(review.textContent).toContain('Added to your tracker');
    expect(review.textContent).not.toContain('Your PDF is downloading');
    expect(mocks.toast).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Not now' }));
    await waitFor(() => expect(screen.queryByRole('dialog', REVIEW)).toBeNull());
    expect(mocks.toast).toHaveBeenCalledTimes(1);
    expect(mocks.toast.mock.calls[0][0]).toBe('Application added');
  });

  it('shows only the toast after Add to tracker when the review is not due, refused or the check fails', async () => {
    mocks.due.mockResolvedValue('no');
    renderProvider();
    await addFromBar();
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledTimes(1));
    expect(mocks.record).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog', REVIEW)).toBeNull();
    cleanup();

    mocks.due.mockResolvedValue('due');
    mocks.record.mockResolvedValue(false);
    mocks.create.mockClear();
    renderProvider();
    await addFromBar();
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole('dialog', REVIEW)).toBeNull();
    cleanup();

    mocks.due.mockRejectedValue(new Error('offline'));
    mocks.create.mockClear();
    renderProvider();
    await addFromBar();
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledTimes(3));
    expect(screen.queryByRole('dialog', REVIEW)).toBeNull();
  });

  it('asks nothing when the bar is dismissed', async () => {
    renderProvider();
    act(() => probe.current?.notifyNewPdf({ id: 'resume-1', sourceResumeId: null }));
    fireEvent.click(await screen.findByRole('button', { name: 'Dismiss' }));
    await settle();
    expect(mocks.due).not.toHaveBeenCalled();
    expect(mocks.record).not.toHaveBeenCalled();
  });

  it('keeps the bar on its resume page and clears it when the user goes elsewhere', async () => {
    mocks.pathname = '/resume';
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const tree = () => (
      <QueryClientProvider client={client}>
        <FeedbackPromptProvider>
          <Probe />
        </FeedbackPromptProvider>
      </QueryClientProvider>
    );
    const view = render(tree());
    act(() => probe.current?.notifyNewPdf({ id: 'resume-1', sourceResumeId: null }));
    expect(await screen.findByRole('status', BAR)).toBeTruthy();

    // The editor moves to the generated resume's own page: the bar stays.
    mocks.pathname = '/resume/resume-1';
    view.rerender(tree());
    expect(screen.queryByRole('status', BAR)).toBeTruthy();

    // Back to Tailor to a job, or any other page: the bar goes and does not come back.
    mocks.pathname = '/resume/tailor';
    view.rerender(tree());
    expect(screen.queryByRole('status', BAR)).toBeNull();
    mocks.pathname = '/resume/resume-1';
    view.rerender(tree());
    expect(screen.queryByRole('status', BAR)).toBeNull();
  });

  it('shows no bar when the user has left for another page before the check finishes', async () => {
    mocks.pathname = '/resume/resume-1';
    let finish: (cards: Record<string, string>) => void = () => undefined;
    mocks.cards.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const tree = () => (
      <QueryClientProvider client={client}>
        <FeedbackPromptProvider>
          <Probe />
        </FeedbackPromptProvider>
      </QueryClientProvider>
    );
    const view = render(tree());
    act(() => probe.current?.notifyNewPdf({ id: 'resume-1', sourceResumeId: null }));

    // The user opens Tailor to a job while the tracker check is still running.
    mocks.pathname = '/resume/tailor';
    view.rerender(tree());
    await act(async () => finish({}));
    expect(screen.queryByRole('status', BAR)).toBeNull();
    expect(mocks.record).not.toHaveBeenCalled();
  });
});
