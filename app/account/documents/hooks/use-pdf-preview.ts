'use client';

import { useEffect, useState } from 'react';

import { pdfUrlToImage } from '@hooks/use-pdf-image';
import { fetchPdfFile } from '@lib/clients/media.client';

export type PdfPreview = { status: 'loading' } | { status: 'ready'; src: string } | { status: 'failed' };

type Result = { url: string; src?: string; failed?: boolean };

/**
 * Draws the first page of a PDF as an image. A failed download or render ends in `failed` instead of loading
 * forever; the object URL is revoked once rendered, and a result that arrives after unmount is ignored.
 */
export function usePdfPreview(pdfUrl: string): PdfPreview {
  const [result, setResult] = useState<Result>();

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | undefined;

    const render = async () => {
      try {
        const blob = await fetchPdfFile(pdfUrl);
        objectUrl = URL.createObjectURL(blob);
        const [src] = await pdfUrlToImage(objectUrl, 1);
        if (!src) throw new Error('The PDF has no pages');
        if (!cancelled) setResult({ url: pdfUrl, src });
      } catch {
        if (!cancelled) setResult({ url: pdfUrl, failed: true });
      } finally {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      }
    };
    void render();

    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  // A result for a previous URL counts as still loading.
  if (!result || result.url !== pdfUrl) return { status: 'loading' };
  if (result.failed || !result.src) return { status: 'failed' };
  return { status: 'ready', src: result.src };
}
