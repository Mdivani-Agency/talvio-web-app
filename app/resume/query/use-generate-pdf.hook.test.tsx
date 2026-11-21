import { act, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Resume } from '@lib/types';
import { renderHook } from '@/test/utils/render';

const { authedFetch, savePdf } = vi.hoisted(() => ({
  authedFetch: vi.fn(),
  savePdf: vi.fn(),
}));

vi.mock('@/lib/supabase/authed-fetch', () => ({ authedFetch }));
vi.mock('@/lib/pdf/save-pdf', () => ({ savePdf }));
vi.mock('./use-resume', () => ({ fetchResume: vi.fn() }));

import { type GeneratePdfPhase, useGenerateResumePdf } from './use-generate-pdf';

const draft: Resume = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Ann Owner',
  template: 'senior-level-talvio',
  color: '#1B1B1B',
  fontSize: 'md',
  metadata: { profile: { firstName: 'Ann', lastName: 'Owner', role: 'Engineer' }, contacts: { email: 'ann@talvio.test' } },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('useGenerateResumePdf phases', () => {
  it('reports building, then downloading once the PDF exists (MDI-670)', async () => {
    const phases: GeneratePdfPhase[] = [];
    let finishGenerate: (value: unknown) => void = () => undefined;
    authedFetch.mockReturnValueOnce(new Promise((resolve) => (finishGenerate = resolve)));
    savePdf.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() =>
      useGenerateResumePdf('user-1', { onPhase: (phase) => phases.push(phase) }),
    );

    act(() => {
      result.current.mutate(draft);
    });
    await waitFor(() => expect(phases).toEqual(['building']));
    expect(savePdf).not.toHaveBeenCalled();

    finishGenerate({
      ok: true,
      json: async () => ({ url: 'https://media.talvio.co/new.pdf', key: 'resume/new.pdf', generated: true }),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(phases).toEqual(['building', 'downloading']);
    expect(savePdf).toHaveBeenCalledWith({ url: 'https://media.talvio.co/new.pdf', name: 'Ann Owner' });
  });
});
