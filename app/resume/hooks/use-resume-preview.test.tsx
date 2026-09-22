import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fullResumeContent } from '../../../test/fixtures/flow';
import { renderHook } from '../../../test/utils/render';

import type { PreviewRenderInputs } from '@lib/resume/preview-inputs';

import { useResumePreview, type ResumePreviewDeps } from './use-resume-preview';

const baseInput: PreviewRenderInputs = {
  resume: structuredClone(fullResumeContent),
  templateKey: 'senior-level-modern',
  color: '#111111',
  fontSize: 'md',
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });
  return { promise, resolve, reject };
}

describe('useResumePreview', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function renderPreview(input = baseInput, deps: ResumePreviewDeps = {}) {
    const generatePreview = deps.generatePreview ?? vi.fn().mockResolvedValue('pdf');
    const imagesFromPdfUrl = deps.imagesFromPdfUrl ?? vi.fn().mockResolvedValue(['page-1']);
    const createObjectUrl = deps.createObjectUrl ?? vi.fn((blob: Blob) => `blob:${blob.size}`);
    const revokeObjectUrl = deps.revokeObjectUrl ?? vi.fn();

    const rendered = renderHook(
      (props: PreviewRenderInputs) => useResumePreview(props, {
        generatePreview,
        imagesFromPdfUrl,
        createObjectUrl,
        revokeObjectUrl,
        debounceMs: 300,
        ...deps,
      }),
      { initialProps: input },
    );

    return {
      ...rendered,
      generatePreview,
      imagesFromPdfUrl,
      createObjectUrl,
      revokeObjectUrl,
    };
  }

  it('does not regenerate when only the filename or label would change', async () => {
    const first = renderPreview();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(first.generatePreview).toHaveBeenCalledTimes(1);
    first.unmount();

    const generatePreview = vi.fn().mockResolvedValue('pdf');
    const { result, unmount } = renderHook(() => {
      const document = {
        ...baseInput,
        name: 'changed.pdf',
        label: 'Changed',
      };
      return useResumePreview({
        resume: document.resume,
        templateKey: document.templateKey,
        color: document.color,
        fontSize: document.fontSize,
      }, {
        generatePreview,
        imagesFromPdfUrl: async () => ['page-1'],
        createObjectUrl: () => 'blob:preview',
        revokeObjectUrl: () => undefined,
        debounceMs: 300,
      });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(generatePreview).toHaveBeenCalledTimes(1);
    expect(result.current.images).toEqual(['page-1']);
    unmount();
  });

  it('discards a slower older render when a newer one finishes first', async () => {
    const older = deferred<string>();
    const newer = deferred<string>();
    const generatePreview = vi.fn()
      .mockImplementationOnce(() => older.promise)
      .mockImplementationOnce(() => newer.promise);
    const imagesFromPdfUrl = vi.fn().mockResolvedValue(['new-page']);

    const { result, rerender, unmount } = renderPreview(baseInput, {
      generatePreview,
      imagesFromPdfUrl,
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    rerender({
      ...baseInput,
      color: '#005BA2',
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    await act(async () => {
      older.resolve('old-pdf');
      await Promise.resolve();
    });
    expect(result.current.images).toEqual([]);
    expect(imagesFromPdfUrl).not.toHaveBeenCalled();

    await act(async () => {
      newer.resolve('new-pdf');
      await Promise.resolve();
    });
    expect(result.current.images).toEqual(['new-page']);
    expect(result.current.error).toBeNull();
    expect(imagesFromPdfUrl).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('discards a stale image conversion after a newer render starts', async () => {
    const olderImages = deferred<string[]>();
    const newerImages = deferred<string[]>();
    const generatePreview = vi.fn().mockResolvedValue('pdf');
    const imagesFromPdfUrl = vi.fn()
      .mockImplementationOnce(() => olderImages.promise)
      .mockImplementationOnce(() => newerImages.promise);

    const { result, rerender, unmount } = renderPreview(baseInput, {
      generatePreview,
      imagesFromPdfUrl,
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    rerender({
      ...baseInput,
      color: '#005BA2',
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    await act(async () => {
      olderImages.resolve(['old-page']);
      await Promise.resolve();
    });
    expect(result.current.images).toEqual([]);

    await act(async () => {
      newerImages.resolve(['new-page']);
      await Promise.resolve();
    });
    expect(result.current.images).toEqual(['new-page']);
    unmount();
  });

  it('keeps the last good preview when a later render fails', async () => {
    const generatePreview = vi.fn()
      .mockResolvedValueOnce('pdf')
      .mockRejectedValueOnce(new Error('render exploded'));

    const { result, rerender, unmount } = renderPreview(baseInput, { generatePreview });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(result.current.images).toEqual(['page-1']);

    rerender({
      ...baseInput,
      fontSize: 'lg',
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(result.current.images).toEqual(['page-1']);
    expect(result.current.error).toBe('render exploded');
    expect(result.current.isLoading).toBe(false);
    unmount();
  });

  it('retries a failed render without writing source values', async () => {
    const generatePreview = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce('pdf');

    const { result, unmount } = renderPreview(baseInput, { generatePreview });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(result.current.error).toBe('offline');
    expect(result.current.images).toEqual([]);

    await act(async () => {
      result.current.retry();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(result.current.images).toEqual(['page-1']);
    expect(result.current.error).toBeNull();
    expect(generatePreview).toHaveBeenCalledTimes(2);
    unmount();
  });

  it('cancels the pending timer and ignores late results after unmount', async () => {
    const pending = deferred<string>();
    const generatePreview = vi.fn(() => pending.promise);
    const imagesFromPdfUrl = vi.fn().mockResolvedValue(['late-page']);
    const revokeObjectUrl = vi.fn();

    const { result, unmount } = renderPreview(baseInput, {
      generatePreview,
      imagesFromPdfUrl,
      revokeObjectUrl,
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(generatePreview).not.toHaveBeenCalled();
    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
      pending.resolve('late-pdf');
      await Promise.resolve();
    });

    expect(generatePreview).not.toHaveBeenCalled();
    expect(imagesFromPdfUrl).not.toHaveBeenCalled();
    expect(result.current.images).toEqual([]);
  });

  it('clamps the selected page when the next preview has fewer pages', async () => {
    const generatePreview = vi.fn().mockResolvedValue('pdf');
    const imagesFromPdfUrl = vi.fn()
      .mockResolvedValueOnce(['one', 'two', 'three'])
      .mockResolvedValueOnce(['only']);

    const { result, rerender, unmount } = renderPreview(baseInput, {
      generatePreview,
      imagesFromPdfUrl,
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    await act(async () => {
      result.current.goToNext();
      result.current.goToNext();
    });
    expect(result.current.pageIndex).toBe(2);

    rerender({
      ...baseInput,
      templateKey: 'senior-level-talvio',
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(result.current.images).toEqual(['only']);
    expect(result.current.pageIndex).toBe(0);
    unmount();
  });

  it('revokes blob URLs after conversion and on replacement', async () => {
    const generatePreview = vi.fn().mockResolvedValue('pdf');
    const createObjectUrl = vi.fn(() => 'blob:preview-1');
    const revokeObjectUrl = vi.fn();

    const { rerender, unmount } = renderPreview(baseInput, {
      generatePreview,
      createObjectUrl,
      revokeObjectUrl,
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:preview-1');

    createObjectUrl.mockReturnValueOnce('blob:preview-2');
    rerender({
      ...baseInput,
      color: '#ffffff',
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:preview-2');
    unmount();
  });
});
