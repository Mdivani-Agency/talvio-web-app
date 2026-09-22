'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { pdfUrlToImage } from '@hooks/use-pdf-image';
import { generateResumePreview } from '@lib/resume/generate-preview';
import {
  PREVIEW_DEBOUNCE_MS,
  clampPreviewPage,
  previewInputKey,
  type PreviewRenderInputs,
} from '@lib/resume/preview-inputs';

export type ResumePreviewDeps = {
  generatePreview?: (input: PreviewRenderInputs) => Promise<unknown>;
  imagesFromPdfUrl?: (url: string) => Promise<string[]>;
  createObjectUrl?: (blob: Blob) => string;
  revokeObjectUrl?: (url: string) => void;
  debounceMs?: number;
};

function defaultCreateObjectUrl(blob: Blob) {
  return URL.createObjectURL(blob);
}

function defaultRevokeObjectUrl(url: string) {
  URL.revokeObjectURL(url);
}

function previewErrorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : 'Failed to render preview';
}

export function useResumePreview(input: PreviewRenderInputs, deps: ResumePreviewDeps = {}) {
  const generatePreview = deps.generatePreview ?? generateResumePreview;
  const imagesFromPdfUrl = deps.imagesFromPdfUrl ?? pdfUrlToImage;
  const createObjectUrl = deps.createObjectUrl ?? defaultCreateObjectUrl;
  const revokeObjectUrl = deps.revokeObjectUrl ?? defaultRevokeObjectUrl;
  const debounceMs = deps.debounceMs ?? PREVIEW_DEBOUNCE_MS;

  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [retryToken, setRetryToken] = useState(0);

  const generationRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const objectUrlRef = useRef<string | undefined>(undefined);
  const inputRef = useRef(input);

  const inputKey = previewInputKey(input);

  const retry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setRetryToken((value) => value + 1);
  }, []);

  const goToNext = useCallback(() => {
    setPageIndex((current) => {
      if (images.length === 0) {
        return 0;
      }
      return current < images.length - 1 ? current + 1 : 0;
    });
  }, [images.length]);

  const goToPrevious = useCallback(() => {
    setPageIndex((current) => {
      if (images.length === 0) {
        return 0;
      }
      return current > 0 ? current - 1 : images.length - 1;
    });
  }, [images.length]);

  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  useEffect(() => {
    const generation = generationRef.current + 1;
    generationRef.current = generation;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }

    timerRef.current = setTimeout(() => {
      setIsLoading(true);
      setError(null);

      void (async () => {
        let createdUrl: string | undefined;
        try {
          const pdf = await generatePreview(inputRef.current);
          if (generation !== generationRef.current) {
            return;
          }

          const blob = new Blob([pdf as BlobPart], { type: 'application/pdf' });
          createdUrl = createObjectUrl(blob);
          objectUrlRef.current = createdUrl;
          const nextImages = await imagesFromPdfUrl(createdUrl);
          if (generation !== generationRef.current) {
            return;
          }

          setImages(nextImages);
          setPageIndex((current) => clampPreviewPage(current, nextImages.length));
          setError(null);
        } catch (caught) {
          if (generation !== generationRef.current) {
            return;
          }
          setError(previewErrorMessage(caught));
        } finally {
          if (createdUrl) {
            if (objectUrlRef.current === createdUrl) {
              objectUrlRef.current = undefined;
            }
            revokeObjectUrl(createdUrl);
          }
          if (generation === generationRef.current) {
            setIsLoading(false);
          }
        }
      })();
    }, debounceMs);

    return () => {
      generationRef.current += 1;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = undefined;
      }
      if (objectUrlRef.current) {
        revokeObjectUrl(objectUrlRef.current);
        objectUrlRef.current = undefined;
      }
    };
  }, [
    createObjectUrl,
    debounceMs,
    generatePreview,
    imagesFromPdfUrl,
    inputKey,
    retryToken,
    revokeObjectUrl,
  ]);

  return {
    images,
    isLoading,
    error,
    pageIndex,
    retry,
    goToNext,
    goToPrevious,
  };
}
