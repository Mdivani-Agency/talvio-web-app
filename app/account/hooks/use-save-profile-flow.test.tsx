import { act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fullAccountDto } from '../../../test/fixtures/flow';
import { renderHook } from '../../../test/utils/render';

const { push, completeSave, mutateAsync, toast, flags, improvement, query } = vi.hoisted(() => ({
  query: { value: '' },
  push: vi.fn(),
  completeSave: vi.fn(),
  mutateAsync: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
  flags: { profileAiImprove: false },
  improvement: vi.fn(),
}));

vi.mock('@/lib/flags', async () => {
  const actual = await vi.importActual<typeof import('@/lib/flags')>('@/lib/flags');
  return { ...actual, featureFlags: () => ({ ...actual.DEFAULT_FEATURE_FLAGS, ...flags }) };
});
vi.mock('@/lib/graphql-client', () => ({ getGraphqlSdk: async () => ({}), parseGraphqlError: (error: Error) => error.message }));
vi.mock('@app/account/query/use-profile-improvement', () => ({ fetchProfileImprovement: improvement }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(query.value),
}));
vi.mock('sonner', () => ({ toast }));
vi.mock('../providers/state-provider', () => ({
  useAccountContext: () => ({ userId: 'user-1', completeSave }),
}));
vi.mock('@app/account/query/use-save-profile', () => ({
  useSaveProfile: () => ({ mutateAsync, isPending: false }),
}));

import { useSaveProfileFlow } from './use-save-profile-flow';

describe('useSaveProfileFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    flags.profileAiImprove = false;
    query.value = '';
  });

  it('goes back to the new resume that sent the user to onboarding', async () => {
    query.value = 'next=%2Fresume%3Ftemplate%3Dtimeline';
    mutateAsync.mockResolvedValue({ ...fullAccountDto, id: 'user-1' });
    const { result, unmount } = renderHook(() => useSaveProfileFlow());
    act(() => {
      result.current.save(fullAccountDto);
    });
    await waitFor(() => expect(push).toHaveBeenCalledWith('/resume?template=timeline'));
    unmount();
  });

  it('carries the new resume through the profile improvement offer', async () => {
    query.value = 'next=%2Fresume';
    flags.profileAiImprove = true;
    improvement.mockResolvedValue({ available: true, used: false, usedAt: null, appliedAt: null });
    mutateAsync.mockResolvedValue({ ...fullAccountDto, id: 'user-1' });
    const { result, unmount } = renderHook(() => useSaveProfileFlow());
    act(() => {
      result.current.save(fullAccountDto);
    });
    await waitFor(() => expect(push).toHaveBeenCalledWith('/account/improve?saved=1&next=%2Fresume'));
    unmount();
  });

  it('ignores a return path that is not the new resume', async () => {
    query.value = 'next=%2Faccount%2Fdocuments';
    mutateAsync.mockResolvedValue({ ...fullAccountDto, id: 'user-1' });
    const { result, unmount } = renderHook(() => useSaveProfileFlow());
    act(() => {
      result.current.save(fullAccountDto);
    });
    await waitFor(() => expect(push).toHaveBeenCalledWith('/account'));
    unmount();
  });

  it('opens the profile improvement offer when it is on and unused', async () => {
    flags.profileAiImprove = true;
    improvement.mockResolvedValue({ available: true, used: false, usedAt: null, appliedAt: null });
    mutateAsync.mockResolvedValue({ ...fullAccountDto, id: 'user-1' });
    const { result, unmount } = renderHook(() => useSaveProfileFlow());
    act(() => {
      result.current.save(fullAccountDto);
    });
    await waitFor(() => expect(push).toHaveBeenCalledWith('/account/improve?saved=1'));
    unmount();
  });

  it.each([
    ['used', () => improvement.mockResolvedValue({ available: false, used: true, usedAt: '2026-11-19T09:00:00Z', appliedAt: null })],
    ['unreadable', () => improvement.mockRejectedValue(new Error('graphql down'))],
  ])('opens /account when the improvement is %s', async (_label, arrange) => {
    flags.profileAiImprove = true;
    arrange();
    mutateAsync.mockResolvedValue({ ...fullAccountDto, id: 'user-1' });
    const { result, unmount } = renderHook(() => useSaveProfileFlow());
    act(() => {
      result.current.save(fullAccountDto);
    });
    await waitFor(() => expect(push).toHaveBeenCalledWith('/account'));
    unmount();
  });

  it('saves the profile, clears the draft and opens /account', async () => {
    mutateAsync.mockResolvedValue({ ...fullAccountDto, id: 'user-1' });
    const { result, unmount } = renderHook(() => useSaveProfileFlow());

    act(() => {
      result.current.save(fullAccountDto);
    });

    await waitFor(() => expect(push).toHaveBeenCalledWith('/account'));
    // With the flag off the improvement is never looked up.
    expect(improvement).not.toHaveBeenCalled();
    expect(mutateAsync).toHaveBeenCalledWith(fullAccountDto);
    expect(completeSave).toHaveBeenCalledTimes(1);
    expect(toast.error).not.toHaveBeenCalled();
    unmount();
  });

  it('stays locked from the click until the next page opens (MDI-670)', async () => {
    let finish: (value: unknown) => void = () => undefined;
    mutateAsync.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const { result, unmount } = renderHook(() => useSaveProfileFlow());
    expect(result.current.locked).toBe(false);
    act(() => {
      result.current.save(fullAccountDto);
    });
    expect(result.current.locked).toBe(true);
    expect(result.current.isSaving).toBe(true);
    act(() => {
      result.current.save(fullAccountDto);
    });
    expect(mutateAsync).toHaveBeenCalledTimes(1);

    await act(async () => finish({ ...fullAccountDto, id: 'user-1' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/account'));
    expect(result.current.locked).toBe(true);
    unmount();
  });

  it('unlocks after a failed save so it can be sent again', async () => {
    mutateAsync.mockRejectedValue(new Error('forced save failure'));
    const { result, unmount } = renderHook(() => useSaveProfileFlow());
    act(() => {
      result.current.save(fullAccountDto);
    });
    await waitFor(() => expect(result.current.locked).toBe(false));
    unmount();
  });

  it('toasts a failed save and keeps the draft and the page', async () => {
    mutateAsync.mockRejectedValue(new Error('forced save failure'));
    const { result, unmount } = renderHook(() => useSaveProfileFlow());

    act(() => {
      result.current.save(fullAccountDto);
    });

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('forced save failure'));
    expect(completeSave).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
    unmount();
  });
});
