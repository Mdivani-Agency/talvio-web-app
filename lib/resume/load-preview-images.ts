import {
  PREVIEW_DEBOUNCE_MS,
  type PreviewRenderInputs,
} from './preview-inputs';

export type PreviewImageLoader = {
  generatePreview: (input: PreviewRenderInputs) => Promise<unknown>;
  imagesFromPdfUrl: (url: string) => Promise<string[]>;
  createObjectUrl?: (blob: Blob) => string;
  revokeObjectUrl?: (url: string) => void;
  debounceMs?: number;
};

function abortError() {
  return new DOMException('The operation was aborted.', 'AbortError');
}

function waitForPreview(ms: number, signal: AbortSignal) {
  if (signal.aborted) {
    return Promise.reject(abortError());
  }
  if (ms <= 0) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(finish, ms);
    function finish() {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }
    function onAbort() {
      clearTimeout(timer);
      reject(abortError());
    }
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

export async function loadPreviewImages(
  input: PreviewRenderInputs,
  loader: PreviewImageLoader,
  signal: AbortSignal,
) {
  const createObjectUrl = loader.createObjectUrl ?? ((blob: Blob) => URL.createObjectURL(blob));
  const revokeObjectUrl = loader.revokeObjectUrl ?? ((url: string) => URL.revokeObjectURL(url));

  await waitForPreview(loader.debounceMs ?? PREVIEW_DEBOUNCE_MS, signal);
  const pdf = await loader.generatePreview(input);
  if (signal.aborted) {
    throw abortError();
  }

  const url = createObjectUrl(new Blob([pdf as BlobPart], { type: 'application/pdf' }));
  try {
    const images = await loader.imagesFromPdfUrl(url);
    if (signal.aborted) {
      throw abortError();
    }
    return images;
  } finally {
    revokeObjectUrl(url);
  }
}
