import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  session: { user: { id: 'user-1' } } as { user: { id: string } } | null,
  flag: true,
  due: vi.fn(),
  record: vi.fn(),
  click: vi.fn(),
  submit: vi.fn(),
}));

vi.mock('@lib/providers', () => ({ useUserSession: () => ({ session: mocks.session }) }));
vi.mock('@lib/flags', () => ({ featureFlags: () => ({ feedbackPrompt: mocks.flag }) }));
vi.mock('@app/resume/query/use-feedback-prompt', () => ({
  fetchFeedbackPromptDue: mocks.due,
  feedbackPromptDueKey: (userId?: string) => ['feedback-prompt-due', userId],
}));
vi.mock('@app/resume/query/use-record-feedback-prompt', () => ({ recordFeedbackPrompt: mocks.record }));
vi.mock('@app/resume/query/use-record-trustpilot-click', () => ({ recordTrustpilotClick: mocks.click }));
vi.mock('@app/resume/query/use-submit-feedback', () => ({ submitFeedback: mocks.submit }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

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
const api = {
  notifyNewPdf: (resume: { id: string }) => probe.current?.notifyNewPdf(resume),
  setGenerateDialogOpen: (open: boolean) => probe.current?.setGenerateDialogOpen(open),
};

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

const PROMPT = { name: 'How did it go? Review Talvio on Trustpilot' };

async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('FeedbackPromptProvider', () => {
  beforeEach(() => {
    mocks.session = { user: { id: 'user-1' } };
    mocks.flag = true;
    mocks.due.mockReset().mockResolvedValue('due');
    mocks.record.mockReset().mockResolvedValue(true);
    mocks.click.mockReset().mockResolvedValue({ id: '' });
    mocks.submit.mockReset().mockResolvedValue({ id: 'feedback-1' });
  });
  afterEach(() => cleanup());

  it('opens after a new PDF when due, and records the prompt first', async () => {
    renderProvider();
    act(() => api.notifyNewPdf({ id: 'resume-1' }));

    expect(await screen.findByRole('dialog', PROMPT)).toBeTruthy();
    expect(mocks.record).toHaveBeenCalledTimes(1);
  });

  it('does nothing with the flag off or without a session', async () => {
    mocks.flag = false;
    renderProvider();
    act(() => api.notifyNewPdf({ id: 'resume-1' }));
    await settle();
    expect(mocks.due).not.toHaveBeenCalled();
    cleanup();

    mocks.flag = true;
    mocks.session = null;
    renderProvider();
    act(() => api.notifyNewPdf({ id: 'resume-1' }));
    await settle();
    expect(mocks.due).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('does not open when not due or when the database refuses the record', async () => {
    mocks.due.mockResolvedValue('no');
    renderProvider();
    act(() => api.notifyNewPdf({ id: 'resume-1' }));
    await settle();
    expect(mocks.record).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();

    mocks.due.mockResolvedValue('due');
    mocks.record.mockResolvedValue(false);
    act(() => api.notifyNewPdf({ id: 'resume-1' }));
    await settle();
    expect(mocks.record).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows nothing when the check or the record call fails', async () => {
    mocks.due.mockRejectedValue(new Error('offline'));
    renderProvider();
    act(() => api.notifyNewPdf({ id: 'resume-1' }));
    await settle();
    expect(screen.queryByRole('dialog')).toBeNull();

    mocks.due.mockResolvedValue('due');
    mocks.record.mockRejectedValue(new Error('offline'));
    act(() => api.notifyNewPdf({ id: 'resume-1' }));
    await settle();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('waits for the Generate dialog to close', async () => {
    renderProvider();
    act(() => api.setGenerateDialogOpen(true));
    act(() => api.notifyNewPdf({ id: 'resume-1' }));
    await settle();
    expect(mocks.record).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();

    act(() => api.setGenerateDialogOpen(false));
    expect(await screen.findByRole('dialog', PROMPT)).toBeTruthy();
  });

  it('sends a message with the resume the PDF came from', async () => {
    renderProvider();
    act(() => api.notifyNewPdf({ id: 'resume-7' }));
    await screen.findByRole('dialog', PROMPT);

    act(() => screen.getByRole('button', { name: 'Tell us what went wrong' }).click());
    const field = screen.getByRole('textbox');
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!;
      setter.call(field, 'It cut off my last job.');
      field.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => {
      screen.getByRole('button', { name: 'Send to Talvio' }).click();
    });

    await waitFor(() =>
      expect(mocks.submit).toHaveBeenCalledWith({ comment: 'It cut off my last job.', resumeId: 'resume-7' }),
    );
    expect(await screen.findByRole('dialog', { name: 'Thanks for telling us' })).toBeTruthy();
  });

  it('records a Trustpilot click and closes', async () => {
    renderProvider();
    act(() => api.notifyNewPdf({ id: 'resume-1' }));
    await screen.findByRole('dialog', PROMPT);

    act(() => screen.getByRole('link', { name: /Write a review on Trustpilot/ }).click());

    expect(mocks.click).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
