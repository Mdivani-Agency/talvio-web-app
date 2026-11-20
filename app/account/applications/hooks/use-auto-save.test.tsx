import { act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderHook } from '@/test/utils/render';
import type { JobApplication } from '@lib/types';

const mutateAsync = vi.fn();
vi.mock('../query/use-update-application', () => ({ useUpdateApplication: () => ({ mutateAsync }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { useAutoSave } from './use-auto-save';

const card = { id: 'a1' } as JobApplication;

describe('useAutoSave', () => {
  it('keeps a failed field failed when another field saves, and Retry sends every unsaved field', async () => {
    const { result } = renderHook(() => useAutoSave(card, 'u1'));

    mutateAsync.mockRejectedValueOnce(new Error('offline'));
    await act(() => result.current.save({ salary: '120k' }));
    expect(result.current.status).toBe('failed');

    mutateAsync.mockRejectedValueOnce(new Error('offline'));
    await act(() => result.current.save({ location: 'Remote' }));
    mutateAsync.mockResolvedValueOnce({});
    await act(() => result.current.save({ contact: 'Ingrid' }));
    expect(result.current.status).toBe('failed');

    mutateAsync.mockResolvedValueOnce({});
    await act(() => result.current.retry());
    expect(mutateAsync).toHaveBeenLastCalledWith({ id: 'a1', patch: { salary: '120k', location: 'Remote' } });
    expect(result.current.status).toBe('saved');
  });

  it('clears a failure once a later save of the same field succeeds', async () => {
    const { result } = renderHook(() => useAutoSave(card, 'u1'));

    mutateAsync.mockRejectedValueOnce(new Error('offline'));
    await act(() => result.current.save({ salary: '120k' }));
    mutateAsync.mockResolvedValueOnce({});
    await act(() => result.current.save({ salary: '125k' }));
    expect(result.current.status).toBe('saved');
  });

  it('runs saves one at a time, in the order they were made', async () => {
    const { result } = renderHook(() => useAutoSave(card, 'u1'));
    const calls: string[] = [];
    let releaseFirst: () => void = () => undefined;
    mutateAsync.mockReset();
    mutateAsync
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            calls.push('start applied');
            releaseFirst = () => {
              calls.push('end applied');
              resolve();
            };
          }),
      )
      .mockImplementationOnce(async () => {
        calls.push('start interview');
      });

    let first: Promise<boolean> = Promise.resolve(true);
    let second: Promise<boolean> = Promise.resolve(true);
    act(() => {
      first = result.current.save({ stage: 'applied' });
      second = result.current.save({ stage: 'interview' });
    });
    expect(result.current.status).toBe('saving');
    await act(async () => {
      await Promise.resolve();
    });
    expect(calls).toEqual(['start applied']);

    await act(async () => {
      releaseFirst();
      await first;
      await second;
    });
    expect(calls).toEqual(['start applied', 'end applied', 'start interview']);
    expect(result.current.status).toBe('saved');
  });

  it('forgets a failed field once it is back to its stored value, so Retry does not write the old edit', async () => {
    const { result } = renderHook(() => useAutoSave(card, 'u1'));
    mutateAsync.mockReset();

    mutateAsync.mockRejectedValueOnce(new Error('offline'));
    await act(() => result.current.save({ salary: '120k' }));
    expect(result.current.status).toBe('failed');

    await act(async () => {
      result.current.forget('salary');
      await Promise.resolve();
    });
    expect(result.current.status).toBe('idle');
    await act(() => result.current.retry());
    expect(mutateAsync).toHaveBeenCalledTimes(1);
  });
});
