'use client';

import { useCallback, useSyncExternalStore } from 'react';

/** Kept on the device, not in the resume (MDI-667). */
export const PREVIEW_FIT_WIDTH_KEY = 'talvio:resume-preview-fit-width';

const listeners = new Set<() => void>();
/** The last choice made on this page. Wins over storage, so the toggle still works when storage is blocked or full. */
let memory: boolean | null = null;

export function readPreviewFitWidth(): boolean {
  if (memory !== null) {
    return memory;
  }
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    return window.localStorage.getItem(PREVIEW_FIT_WIDTH_KEY) === '1';
  } catch {
    return false;
  }
}

export function writePreviewFitWidth(on: boolean) {
  memory = on;
  try {
    if (on) {
      window.localStorage.setItem(PREVIEW_FIT_WIDTH_KEY, '1');
    } else {
      window.localStorage.removeItem(PREVIEW_FIT_WIDTH_KEY);
    }
  } catch {
    // Storage blocked or full: the toggle still works until the page reloads.
  }
  listeners.forEach((listener) => listener());
}

/** Tests only: forget the in-memory choice. */
export function resetPreviewFitWidthMemory() {
  memory = null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === PREVIEW_FIT_WIDTH_KEY) {
      // Another tab changed it: storage is the source again.
      memory = null;
      listener();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

/** The preview's Fit width toggle: off (whole page) by default, remembered in local storage. */
export function usePreviewFitWidth() {
  const fitWidth = useSyncExternalStore(subscribe, readPreviewFitWidth, () => false);
  const setFitWidth = useCallback((on: boolean) => writePreviewFitWidth(on), []);
  return { fitWidth, setFitWidth };
}
