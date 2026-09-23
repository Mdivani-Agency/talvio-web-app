'use client';

import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { pdfUrlToImage } from '@hooks/use-pdf-image';
import { generateResumePreview } from '@lib/resume/generate-preview';
import { loadPreviewImages, type PreviewImageLoader } from '@lib/resume/load-preview-images';
import {
  PREVIEW_DEBOUNCE_MS,
  clampPreviewPage,
  previewInputKey,
  type PreviewRenderInputs,
} from '@lib/resume/preview-inputs';

export type ResumePreviewDeps = Partial<PreviewImageLoader>;

const LAST_PREVIEW_IMAGES = ['resume-preview', 'last-success'] as const;

function previewErrorMessage(error: unknown) {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return null;
  }
  if (error instanceof Error && (error.name === 'CancelledError' || error.message === 'CancelledError')) {
    return null;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Failed to render preview';
}

export function useResumePreview(input: PreviewRenderInputs, deps: ResumePreviewDeps = {}) {
  const queryClient = useQueryClient();
  const debounceMs = deps.debounceMs ?? PREVIEW_DEBOUNCE_MS;
  const inputKey = previewInputKey(input);
  const generatePreview = deps.generatePreview ?? generateResumePreview;
  const imagesFromPdfUrl = deps.imagesFromPdfUrl ?? pdfUrlToImage;
  const createObjectUrl = deps.createObjectUrl;
  const revokeObjectUrl = deps.revokeObjectUrl;

  const query = useQuery({
    queryKey: ['resume-preview', inputKey, debounceMs],
    queryFn: async ({ signal, client }) => {
      const images = await loadPreviewImages(input, {
        generatePreview,
        imagesFromPdfUrl,
        createObjectUrl,
        revokeObjectUrl,
        debounceMs,
      }, signal);
      client.setQueryData(LAST_PREVIEW_IMAGES, images);
      return images;
    },
    placeholderData: keepPreviousData,
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const lastImages = queryClient.getQueryData<string[]>(LAST_PREVIEW_IMAGES) ?? [];
  const images = query.data ?? lastImages;
  const [pageIndex, setPageIndex] = useState(0);
  const visiblePage = clampPreviewPage(pageIndex, images.length);

  const retry = useCallback(() => {
    void query.refetch();
  }, [query]);

  const goToNext = useCallback(() => {
    setPageIndex((current) => {
      if (images.length === 0) {
        return 0;
      }
      const safe = clampPreviewPage(current, images.length);
      return safe < images.length - 1 ? safe + 1 : 0;
    });
  }, [images.length]);

  const goToPrevious = useCallback(() => {
    setPageIndex((current) => {
      if (images.length === 0) {
        return 0;
      }
      const safe = clampPreviewPage(current, images.length);
      return safe > 0 ? safe - 1 : images.length - 1;
    });
  }, [images.length]);

  return {
    images,
    isLoading: query.isFetching || query.isPending,
    error: query.isError ? previewErrorMessage(query.error) : null,
    pageIndex: visiblePage,
    retry,
    goToNext,
    goToPrevious,
  };
}
