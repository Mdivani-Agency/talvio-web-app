import { act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fullAccountDto } from '../../../test/fixtures/flow';
import { renderHook } from '../../../test/utils/render';

const { push, completeSave, mutateAsync, toast, flags, improvement } = vi.hoisted(() => ({
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

vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
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
