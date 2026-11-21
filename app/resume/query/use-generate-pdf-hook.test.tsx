import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Resume } from '@lib/types';

const { authedFetch, savePdf } = vi.hoisted(() => ({ authedFetch: vi.fn(), savePdf: vi.fn() }));

vi.mock('@/lib/supabase/authed-fetch', () => ({ authedFetch }));
vi.mock('./use-resume', () => ({ fetchResume: vi.fn() }));
vi.mock('@/lib/pdf/save-pdf', () => ({ savePdf }));

import { useGenerateResumePdf } from './use-generate-pdf';

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

function setup(options?: Parameters<typeof useGenerateResumePdf>[1]) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const { result } = renderHook(() => useGenerateResumePdf('user-1', options), { wrapper });
  return { result, invalidate };
}

describe('useGenerateResumePdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authedFetch.mockResolvedValue(
      new Response(JSON.stringify({ url: 'https://media.test/a.pdf', key: 'a.pdf', generated: true }), { status: 200 }),
    );
  });

  it('saves the new PDF and refreshes the resume, family, list, credits and documents', async () => {
    savePdf.mockResolvedValue('saved');
    const onNewPdf = vi.fn();
    const { result, invalidate } = setup({ onNewPdf });

    await act(async () => {
      await result.current.mutateAsync(draft);
    });

    expect(savePdf).toHaveBeenCalledWith({ url: 'https://media.test/a.pdf', name: 'Ann Owner' });
    expect(onNewPdf).toHaveBeenCalledWith(expect.objectContaining({ id: draft.id }));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['resume', draft.id] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['documents', 'user-1'] });
  });

  it('still shows the generated PDF when only the save on this device fails', async () => {
    savePdf.mockRejectedValue(new Error('disk full'));
    const onNewPdf = vi.fn();
    const { result, invalidate } = setup({ onNewPdf });

    let error: unknown;
    await act(async () => {
      error = await result.current.mutateAsync(draft).catch((caught: unknown) => caught);
    });

    expect((error as Error).message).toBe('Could not load the PDF. Check your connection and try again.');
    // Generated and charged: the page must not offer Generate again.
    expect(onNewPdf).toHaveBeenCalled();
    for (const queryKey of [['resume', draft.id], ['resume-family'], ['resumes', 'user-1'], ['credits', 'user-1'], ['documents', 'user-1']]) {
      expect(invalidate).toHaveBeenCalledWith({ queryKey });
    }
  });

  it('does not save when the page offers Download and Open itself', async () => {
    const { result } = setup({ save: false });

    await act(async () => {
      await result.current.mutateAsync(draft);
    });

    expect(savePdf).not.toHaveBeenCalled();
  });
});
