import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EXPERIENCE_ID, savedAccount } from '../../../test/fixtures/flow';

const { improve, push, params } = vi.hoisted(() => ({
  improve: { current: {} as Record<string, unknown> },
  push: vi.fn(),
  params: { saved: '1' as string | null },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => ({ get: (key: string) => (key === 'saved' ? params.saved : null) }),
}));
vi.mock('../providers/state-provider', () => ({ useAccountContext: () => ({ userId: 'user-1' }) }));
vi.mock('@app/account/query/use-profile', () => ({ fetchProfile: async () => savedAccount }));
vi.mock('@app/account/hooks/use-profile-improve', () => ({ useProfileImprove: () => improve.current }));
vi.mock('@components/views', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@components/views')>()),
  Loading: ({ message }: { message?: string }) => <p role="status">{message}</p>,
}));

import ImprovePage from './improve-page';

function hook(patch: Record<string, unknown>) {
  improve.current = {
    step: 'idle',
    loadingStage: null,
    savedCount: 0,
    improvement: { available: true, used: false, usedAt: null, appliedAt: null },
    questions: [],
    questionDetails: {},
    answers: [],
    currentQuestionId: null,
    unsentAnswer: '',
    review: null,
    failure: null,
    saving: false,
    canSave: false,
    start: vi.fn(),
    setUnsentAnswer: vi.fn(),
    answerCurrent: vi.fn(),
    goToPreviousQuestion: vi.fn(),
    skipRemaining: vi.fn(),
    requestProposal: vi.fn(),
    toggleSelected: vi.fn(),
    toggleConfirmed: vi.fn(),
    save: vi.fn(),
    retry: vi.fn(),
    stop: vi.fn(),
    dismiss: vi.fn(),
    ...patch,
  };
  return improve.current as Record<string, ReturnType<typeof vi.fn>>;
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ImprovePage />
    </QueryClientProvider>,
  );
}

const QUESTIONS = [
  { id: 'q1', question: 'What changed after the migration?', example: '' },
  { id: 'q2', question: 'How big was the team?', example: '' },
];
const DETAILS = {
  q1: { reason: 'Your role says what you did, not what it led to.', guidance: 'Numbers help.', targetSection: 'experience', targetEntityId: EXPERIENCE_ID },
  q2: { reason: 'No team size yet.', guidance: null, targetSection: null, targetEntityId: null },
};

describe('ImprovePage', () => {
  beforeEach(() => {
    params.saved = '1';
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('offers the improvement after Save profile and starts it', async () => {
    const actions = hook({});
    renderPage();
    const heading = await screen.findByRole('heading', { name: 'Answer a few questions, get better wording' });
    await waitFor(() => expect(document.activeElement).toBe(heading));
    expect((screen.getByRole('status')).textContent).toContain('Profile saved. Every resume you create starts from it.');
    expect(screen.getByText('Free, once per account')).toBeTruthy();
    expect((screen.getByRole('link', { name: 'Skip for now' })).getAttribute('href')).toBe('/account');
    fireEvent.click(screen.getByRole('button', { name: 'Start the questions' }));
    expect(actions.start).toHaveBeenCalledTimes(1);
  });

  it('shows the used screen with the day it ran instead of the offer', async () => {
    params.saved = null;
    hook({ improvement: { available: false, used: true, usedAt: '2026-11-12T09:00:00Z', appliedAt: null } });
    renderPage();
    expect(await screen.findByRole('heading', { name: 'You have used your free profile improvement' })).toBeTruthy();
    expect(screen.getByText(/yours ran on 12 November/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Start the questions' })).toBeNull();
  });

  it('offers a retry when the improvement flag cannot be read', async () => {
    const actions = hook({ improvement: null, improvementError: true, refetchImprovement: vi.fn() });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /try again/i }));
    expect(actions.refetchImprovement).toHaveBeenCalledTimes(1);
  });

  it('shows loading with live status and Cancel', async () => {
    const actions = hook({ step: 'loading', loadingStage: 'questions' });
    renderPage();
    const heading = await screen.findByRole('heading', { name: 'Reading your profile' });
    expect((heading.closest('section')!).getAttribute('aria-busy')).toBe('true');
    // On the page lock (MDI-670): a modal card over an inert page, which says the page unlocks, not that it can be left.
    expect(screen.getByRole('dialog', { name: 'Reading your profile' }).getAttribute('aria-modal')).toBe('true');
    expect(screen.getByText('This can take a minute. The page unlocks when your questions are ready.')).toBeTruthy();
    const steps = screen.getAllByRole('listitem');
    expect(steps.map((step) => step.getAttribute('data-state'))).toEqual(['done', 'active']);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(actions.stop).toHaveBeenCalledTimes(1);
  });

  it('asks a question with its target, reason, progress and count', async () => {
    const actions = hook({
      step: 'questions',
      questions: QUESTIONS,
      questionDetails: DETAILS,
      currentQuestionId: 'q1',
      unsentAnswer: 'Deploys went to 15 minutes',
    });
    renderPage();
    const heading = await screen.findByRole('heading', { name: 'What changed after the migration?' });
    await waitFor(() => expect(document.activeElement).toBe(heading));
    expect(screen.getByText('Question 1 of 2')).toBeTruthy();
    expect((screen.getByRole('progressbar', { name: 'Questions answered' })).getAttribute('aria-valuenow')).toBe('1');
    expect(screen.getByText('Experience · Talvio')).toBeTruthy();
    expect(screen.getByText('Your role says what you did, not what it led to.')).toBeTruthy();
    expect(((screen.getByLabelText('Your answer')) as HTMLTextAreaElement).value).toBe('Deploys went to 15 minutes');
    expect(screen.getByText('26 / 2,000')).toBeTruthy();
    expect(screen.queryByText(/uses your one free profile improvement/)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(actions.answerCurrent).toHaveBeenCalledWith('answered');
    fireEvent.click(screen.getByRole('button', { name: 'Skip this question' }));
    expect(actions.answerCurrent).toHaveBeenCalledWith('skipped');
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(actions.stop).toHaveBeenCalledTimes(1);
  });

  it('warns on the last question that suggested edits use the free improvement', async () => {
    hook({ step: 'questions', questions: QUESTIONS, questionDetails: DETAILS, currentQuestionId: 'q2' });
    renderPage();
    await screen.findByRole('heading', { name: 'How big was the team?' });
    expect(screen.getByText(/uses your one free profile improvement/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Get suggested edits' })).toBeTruthy();
    expect(screen.getByText('Your profile')).toBeTruthy();
  });

  it('blocks Save until a selected claim is confirmed', async () => {
    const actions = hook({
      step: 'review',
      questions: QUESTIONS,
      review: {
        changes: [
          { id: 'c1', section: 'profile', field: 'tagline', before: 'Old', after: 'New', selected: true, confirmed: false, needsConfirmation: false, claims: [], fromQuestionId: null },
          {
            id: 'c2',
            section: 'experience',
            index: 0,
            title: 'Talvio',
            field: 'achievements',
            before: 'Cut PDF render time',
            after: 'Cut PDF render time by 60%',
            selected: true,
            confirmed: false,
            needsConfirmation: true,
            claims: ['Render time fell by 60%.'],
            fromQuestionId: 'q1',
          },
        ],
        skipped: 0,
        unconfirmed: ['c2'],
      },
    });
    renderPage();
    const heading = await screen.findByRole('heading', { name: '2 suggested edits' });
    await waitFor(() => expect(document.activeElement).toBe(heading));
    expect(((screen.getByRole('checkbox', { name: 'About you · Tagline' })) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByText('From your answer to question 1')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Save 2 edits to my profile' }));
    expect(actions.save).not.toHaveBeenCalled();
    await waitFor(() => expect((screen.getByRole('alert')).textContent).toContain('Confirm the highlighted fact or untick that edit to save.'));

    fireEvent.click(screen.getByRole('checkbox', { name: 'Confirm it is true: Render time fell by 60%.' }));
    expect(actions.toggleConfirmed).toHaveBeenCalledWith('c2');
    fireEvent.click(screen.getByRole('checkbox', { name: 'About you · Tagline' }));
    expect(actions.toggleSelected).toHaveBeenCalledWith('c1');

    fireEvent.click(screen.getByRole('button', { name: 'Keep my profile as it is' }));
    expect(actions.stop).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/account');
  });

  it('reports the saved edits', async () => {
    hook({ step: 'done', savedCount: 2 });
    renderPage();
    expect(await screen.findByRole('heading', { name: '2 edits saved to your profile' })).toBeTruthy();
    expect((screen.getByRole('link', { name: 'Create a resume' })).getAttribute('href')).toBe('/resume');
    expect((screen.getByRole('link', { name: 'Go to my account' })).getAttribute('href')).toBe('/account');
  });

  it("shows today's limit and a retryable failure", async () => {
    hook({ step: 'limit' });
    const { unmount } = renderPage();
    expect(await screen.findByRole('heading', { name: "AI has reached today's limit" })).toBeTruthy();
    expect(screen.getByText(/It resets at .+ your time\./)).toBeTruthy();
    unmount();

    const actions = hook({ step: 'unavailable', failure: { message: 'AI features are not available for this account.' } });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
    expect(actions.retry).toHaveBeenCalledTimes(1);
  });
});
