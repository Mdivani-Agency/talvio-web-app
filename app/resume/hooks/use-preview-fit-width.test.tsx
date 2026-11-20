import { act, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderHook } from '@/test/utils/render';

import {
  PREVIEW_FIT_WIDTH_KEY,
  readPreviewFitWidth,
  resetPreviewFitWidthMemory,
  usePreviewFitWidth,
} from './use-preview-fit-width';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.localStorage.clear();
  resetPreviewFitWidthMemory();
});

describe('usePreviewFitWidth', () => {
  it('starts on whole page', () => {
    const { result } = renderHook(() => usePreviewFitWidth());
    expect(result.current.fitWidth).toBe(false);
  });

  it('remembers the choice on the device and shares it across hooks', () => {
    const first = renderHook(() => usePreviewFitWidth());
    const second = renderHook(() => usePreviewFitWidth());
    act(() => first.result.current.setFitWidth(true));
    expect(window.localStorage.getItem(PREVIEW_FIT_WIDTH_KEY)).toBe('1');
    expect(first.result.current.fitWidth).toBe(true);
    expect(second.result.current.fitWidth).toBe(true);

    act(() => first.result.current.setFitWidth(false));
    expect(window.localStorage.getItem(PREVIEW_FIT_WIDTH_KEY)).toBeNull();
    expect(readPreviewFitWidth()).toBe(false);
  });

  it('reads a stored choice on mount', () => {
    window.localStorage.setItem(PREVIEW_FIT_WIDTH_KEY, '1');
    const { result } = renderHook(() => usePreviewFitWidth());
    expect(result.current.fitWidth).toBe(true);
  });

  it.each([
    ['blocked', new DOMException('The operation is insecure.', 'SecurityError')],
    ['full', new DOMException('Quota exceeded', 'QuotaExceededError')],
  ])('still toggles when storage is %s', (_case, error) => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw error;
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw error;
    });
    const { result } = renderHook(() => usePreviewFitWidth());
    act(() => result.current.setFitWidth(true));
    expect(result.current.fitWidth).toBe(true);
    act(() => result.current.setFitWidth(false));
    expect(result.current.fitWidth).toBe(false);
  });

  it('follows a change made in another tab', () => {
    const { result } = renderHook(() => usePreviewFitWidth());
    act(() => result.current.setFitWidth(false));
    act(() => {
      window.localStorage.setItem(PREVIEW_FIT_WIDTH_KEY, '1');
      window.dispatchEvent(new StorageEvent('storage', { key: PREVIEW_FIT_WIDTH_KEY, newValue: '1' }));
    });
    expect(result.current.fitWidth).toBe(true);
  });
});
