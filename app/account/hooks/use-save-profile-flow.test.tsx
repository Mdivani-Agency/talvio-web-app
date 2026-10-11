import { act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fullAccountDto } from '../../../test/fixtures/flow';
import { renderHook } from '../../../test/utils/render';

const { push, completeSave, mutateAsync, toast } = vi.hoisted(() => ({
  push: vi.fn(),
  completeSave: vi.fn(),
  mutateAsync: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}));

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
  });

  it('saves the profile, clears the draft and opens /account', async () => {
    mutateAsync.mockResolvedValue({ ...fullAccountDto, id: 'user-1' });
    const { result, unmount } = renderHook(() => useSaveProfileFlow());

    act(() => {
      result.current.save(fullAccountDto);
    });

    await waitFor(() => expect(push).toHaveBeenCalledWith('/account'));
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
