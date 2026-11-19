import { act, cleanup, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fetchPdfFile = vi.fn();
const pdfUrlToImage = vi.fn();
vi.mock('@lib/clients/media.client', () => ({ fetchPdfFile: (url: string) => fetchPdfFile(url) }));
vi.mock('@hooks/use-pdf-image', () => ({ pdfUrlToImage: (url: string, pages?: number) => pdfUrlToImage(url, pages) }));

import { renderHook } from '@/test/utils/render';

import { usePdfPreview } from './use-pdf-preview';

describe('usePdfPreview', () => {
  const createObjectURL = vi.fn(() => 'blob:preview');
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    Object.assign(URL, { createObjectURL, revokeObjectURL });
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('loads, then shows the first page and revokes the object URL', async () => {
    fetchPdfFile.mockResolvedValue(new Blob(['%PDF']));
    pdfUrlToImage.mockResolvedValue(['data:image/png;base64,AAA']);
    const { result } = renderHook(() => usePdfPreview('https://media.example/a.pdf'));
    expect(result.current).toEqual({ status: 'loading' });
    await waitFor(() => expect(result.current).toEqual({ status: 'ready', src: 'data:image/png;base64,AAA' }));
    expect(pdfUrlToImage).toHaveBeenCalledWith('blob:preview', 1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview');
  });

  it('fails instead of loading forever when the download or the render rejects', async () => {
    fetchPdfFile.mockRejectedValue(new Error('blocked'));
    const blocked = renderHook(() => usePdfPreview('https://media.example/blocked.pdf'));
    await waitFor(() => expect(blocked.result.current).toEqual({ status: 'failed' }));

    fetchPdfFile.mockResolvedValue(new Blob(['not a pdf']));
    pdfUrlToImage.mockRejectedValue(new Error('Invalid PDF structure'));
    const broken = renderHook(() => usePdfPreview('https://media.example/broken.pdf'));
    await waitFor(() => expect(broken.result.current).toEqual({ status: 'failed' }));
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview');
  });

  it('ignores a result that arrives after unmount', async () => {
    let finish: (images: string[]) => void = () => {};
    fetchPdfFile.mockResolvedValue(new Blob(['%PDF']));
    pdfUrlToImage.mockReturnValue(new Promise<string[]>((resolve) => (finish = resolve)));
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result, unmount } = renderHook(() => usePdfPreview('https://media.example/slow.pdf'));
    await waitFor(() => expect(pdfUrlToImage).toHaveBeenCalled());
    unmount();
    await act(async () => finish(['data:image/png;base64,LATE']));
    expect(result.current).toEqual({ status: 'loading' });
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });
});
