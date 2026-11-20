'use client';

import { useCallback, useSyncExternalStore } from 'react';

/** Kept on the device, not in the resume (MDI-667). */
export const PREVIEW_FIT_WIDTH_KEY = 'talvio:resume-preview-fit-width';

const listeners = new Set<() => void>();

export function readPreviewFitWidth(): boolean {
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

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === PREVIEW_FIT_WIDTH_KEY) {
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
