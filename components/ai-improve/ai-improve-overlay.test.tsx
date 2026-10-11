import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AI_CAP_TITLE } from '@lib/ai-cap';
import { fullResumeContent } from '../../test/fixtures/flow';

import { AiImproveOverlay, type AiImproveOverlaySession } from './ai-improve-overlay';

function session(patch: Partial<AiImproveOverlaySession>): AiImproveOverlaySession {
  return {
    step: 'idle',
    questions: [{ id: 'question-1', question: 'What impact did you deliver?', example: 'Cut costs' }],
    answers: [{ questionId: 'question-1', status: 'answered', value: 'Cut render time' }],
    currentQuestionId: null,
    unsentAnswer: '',
    writingVoiceVersion: null,
    review: null,
    failure: null,
    cap: null,
    notice: null,
    setUnsentAnswer: vi.fn(),
    answerCurrent: vi.fn(),
    goToPreviousQuestion: vi.fn(),
    requestProposal: vi.fn(),
    accept: vi.fn(),
    reject: vi.fn(),
    cancel: vi.fn(),
    close: vi.fn(),
    retry: vi.fn(),
    ...patch,
  };
}

describe('AiImproveOverlay', () => {
  afterEach(() => cleanup());

  it('renders nothing while idle', () => {
    const { container } = render(<AiImproveOverlay session={session({})} />);
    expect(container.innerHTML).toBe('');
  });

  it('lists the answers and asks for the proposal', () => {
    const value = session({ step: 'answerReview' });
    render(<AiImproveOverlay session={value} />);

    expect(screen.getByText('Cut render time')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Improve with AI' }));
    expect(value.requestProposal).toHaveBeenCalledTimes(1);
  });

  it('shows before and after, the kept sections and the voice badge', () => {
    const value = session({
      step: 'proposalReview',
      writingVoiceVersion: 2,
      review: {
        resume: fullResumeContent,
        keptSections: ['education'],
        changes: [{ section: 'experience', index: 0, title: 'Talvio', field: 'achievements', before: 'Old line', after: 'New line' }],
      },
    });
    render(<AiImproveOverlay session={value} />);

    expect(screen.getByText('Experience · Talvio · Achievements')).toBeTruthy();
    expect(screen.getByText('Old line')).toBeTruthy();
    expect(screen.getByText('New line')).toBeTruthy();
    expect(screen.getByText(/so those sections kept your entries/)).toBeTruthy();
    expect(screen.getByText('Written in your voice (v2)')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
    expect(value.accept).toHaveBeenCalledTimes(1);
    expect(value.reject).toHaveBeenCalledTimes(1);
  });

  it('offers Retry and Cancel after a failure, and Close at the cap', () => {
    const failed = session({ step: 'error', failure: { stage: 'proposal', message: 'Failed to tailor account' } });
    render(<AiImproveOverlay session={failed} />);
    expect(screen.getByRole('heading', { name: 'Could not write suggestions' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(failed.retry).toHaveBeenCalledTimes(1);
    cleanup();

    const capped = session({ step: 'capped', cap: { message: "You have used today's 20 AI requests." } });
    render(<AiImproveOverlay session={capped} />);
    expect(screen.getByRole('heading', { name: AI_CAP_TITLE })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(capped.close).toHaveBeenCalledTimes(1);
  });
});
