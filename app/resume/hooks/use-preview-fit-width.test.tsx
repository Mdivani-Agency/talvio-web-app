import { act, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { renderHook } from '@/test/utils/render';

import { PREVIEW_FIT_WIDTH_KEY, readPreviewFitWidth, usePreviewFitWidth } from './use-preview-fit-width';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
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
});
