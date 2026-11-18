import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { fullResumeContent } from '../../../test/fixtures/flow';
import type { Tailor } from '../hooks/use-tailor';
import { TailorView, type TailorSourceOption } from './tailor-view';

afterEach(cleanup);

function intakeTailor() {
  return { step: 'intake', questions: [], currentQuestionId: null, start: vi.fn() } as unknown as Tailor & { start: ReturnType<typeof vi.fn> };
}

describe('TailorView intake', () => {
  it('loads the chosen source before starting, so a saved resume brings its content', async () => {
    const tailor = intakeTailor();
    const base = {
      source: { kind: 'resume', id: 'r-1', revision: '2026-11-12T10:00:00.000Z', resumeType: 'general', state: 'draft', sourceResumeId: null },
      document: fullResumeContent,
      look: { template: 'senior-level-modern', color: '#000000', fontSize: 'md' },
    } as const;
    const build = vi.fn(async () => base);
    const sources: TailorSourceOption[] = [{ value: 'r-1', label: 'My resume', build: build as never }];
    render(<TailorView tailor={tailor} sources={sources} onCreate={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Paste the job description here'), { target: { value: 'We need a platform engineer.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(tailor.start).toHaveBeenCalledTimes(1));
    expect(build).toHaveBeenCalledTimes(1);
    expect(tailor.start.mock.calls[0]![0]).toMatchObject({ document: fullResumeContent, resumeName: 'Tailored resume' });
  });

  it('says so when the source cannot be loaded, and does not start', async () => {
    const tailor = intakeTailor();
    const sources: TailorSourceOption[] = [{ value: 'r-1', label: 'My resume', build: () => Promise.reject(new Error('offline')) }];
    render(<TailorView tailor={tailor} sources={sources} onCreate={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('Paste the job description here'), { target: { value: 'Job' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText(/could not be loaded/)).toBeTruthy();
    expect(tailor.start).not.toHaveBeenCalled();
  });
});
