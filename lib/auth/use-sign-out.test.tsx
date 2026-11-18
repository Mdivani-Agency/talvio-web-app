import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const signOut = vi.fn();
const clearLegacyBearerToken = vi.fn();
const toastError = vi.fn();

vi.mock('@lib/supabase/client', () => ({ createSupabaseBrowserClient: () => ({ auth: { signOut } }) }));
vi.mock('@lib/supabase/legacy-token', () => ({ clearLegacyBearerToken: () => clearLegacyBearerToken() }));
vi.mock('sonner', () => ({ toast: { error: (message: string) => toastError(message) } }));

import { renderHook } from '@/test/utils/render';
import { useSignOut } from './use-sign-out';

describe('useSignOut', () => {
  const replace = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('location', { ...window.location, replace });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('signs out, clears the legacy token, then loads the homepage', async () => {
    signOut.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useSignOut());

    await act(() => result.current.signOut());

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(clearLegacyBearerToken).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith('/');
    expect(toastError).not.toHaveBeenCalled();
  });

  it('keeps the session state and shows a toast when sign-out fails', async () => {
    signOut.mockResolvedValue({ error: new Error('network') });
    const { result } = renderHook(() => useSignOut());

    await act(() => result.current.signOut());

    expect(clearLegacyBearerToken).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith('Could not sign out. Try again.');
    expect(result.current.pending).toBe(false);
  });
});
