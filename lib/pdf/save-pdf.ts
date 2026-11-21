/**
 * Download and Open for a generated PDF that lives on the media domain.
 *
 * The browser ignores `<a download>` for a file on another origin and opens it instead, and it blocks a new tab that
 * is not opened during a click. So both actions fetch the file into this page first:
 * - Download asks where to save it where the browser can (the File System Access save dialog in Chrome and Edge), and
 *   otherwise saves the fetched copy under its name, which goes to Downloads or the browser's own "ask where" prompt.
 * - Open opens the tab during the click, then shows the fetched copy in it. A stored PDF is saved as an attachment
 *   (`Content-Disposition`), so pointing the tab at its URL would download it instead of showing it.
 *
 * When the file cannot be fetched into the page (a network or CORS failure), both fall back to the file's own URL: a
 * stored attachment then still downloads, and an older file without one opens in the tab, as it did before.
 *
 * Call both from a click handler, before any other `await`: the save dialog and the new tab need the click.
 */

export type PdfFile = { url: string; name: string };

export type SaveResult = 'saved' | 'cancelled';
export type OpenResult = 'opened' | 'blocked';

/** How long a fetched copy stays addressable. The tab or download has read it long before. */
const OBJECT_URL_LIFETIME_MS = 5 * 60_000;

type SaveFilePicker = (options: {
  suggestedName: string;
  types: { description: string; accept: Record<string, string[]> }[];
}) => Promise<{ createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }> }>;

/** The name the saved file gets: the resume name with one `.pdf`. */
export function pdfFilename(name: string): string {
  const trimmed = name.trim() || 'resume';
  return /\.pdf$/i.test(trimmed) ? trimmed : `${trimmed}.pdf`;
}

/** The PDF bytes. Throws when the file cannot be read, so the caller can say so. */
export async function fetchPdfBlob(url: string): Promise<Blob> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`PDF request failed (${response.status})`);
  }
  const blob = await response.blob();
  return blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
}

function saveFilePicker(): SaveFilePicker | undefined {
  if (typeof window === 'undefined') return undefined;
  const picker = (window as Window & { showSaveFilePicker?: SaveFilePicker }).showSaveFilePicker;
  return typeof picker === 'function' ? picker.bind(window) : undefined;
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException ? error.name === 'AbortError' : (error as { name?: string })?.name === 'AbortError';
}

/** Last resort: the file's own URL in a new tab. An attachment downloads under its stored name; an older file opens. */
function saveFromUrl(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function saveWithLink(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  // Same-origin (a blob URL), so the browser honours the name and saves instead of opening.
  link.download = filename;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(href), OBJECT_URL_LIFETIME_MS);
}

/**
 * Saves the PDF. Asks where to save it when the browser has a save dialog; `cancelled` when the user closes it. A
 * browser without one, or a call that is no longer part of a click, saves under the file's name instead.
 */
export async function savePdf(file: PdfFile): Promise<SaveResult> {
  const filename = pdfFilename(file.name);
  const picker = saveFilePicker();
  if (picker) {
    let handle: Awaited<ReturnType<SaveFilePicker>> | null = null;
    try {
      // First, while the click still counts: the dialog is refused after it.
      handle = await picker({
        suggestedName: filename,
        types: [{ description: 'PDF document', accept: { 'application/pdf': ['.pdf'] } }],
      });
    } catch (error) {
      if (isAbort(error)) {
        return 'cancelled';
      }
      // Not allowed here (no click any more, an iframe, a policy): save the plain way below.
      handle = null;
    }
    if (handle) {
      // The user picked a place; a file that cannot be fetched here is an error to report, not a second save.
      const blob = await fetchPdfBlob(file.url);
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return 'saved';
    }
  }
  let blob: Blob;
  try {
    blob = await fetchPdfBlob(file.url);
  } catch {
    saveFromUrl(file.url, filename);
    return 'saved';
  }
  saveWithLink(blob, filename);
  return 'saved';
}

/**
 * Opens the PDF in a new tab. The tab opens during the click (so it is not blocked), shows a short note while the file
 * loads, then shows the PDF. `blocked` when the browser refused the tab anyway.
 */
export async function openPdf(file: PdfFile): Promise<OpenResult> {
  const tab = window.open('', '_blank');
  if (!tab) {
    return 'blocked';
  }
  try {
    // The PDF does not need a way back to this page.
    tab.opener = null;
  } catch {
    // Some browsers do not allow it; the tab still works.
  }
  try {
    tab.document.title = pdfFilename(file.name);
    tab.document.body.textContent = 'Opening your PDF…';
  } catch {
    // A tab we cannot write to still takes the PDF below.
  }
  let blob: Blob;
  try {
    blob = await fetchPdfBlob(file.url);
  } catch {
    // Not readable from this page: the tab loads the file itself (an older file shows, an attachment downloads).
    tab.location.href = file.url;
    return 'opened';
  }
  const href = URL.createObjectURL(blob);
  tab.location.href = href;
  setTimeout(() => URL.revokeObjectURL(href), OBJECT_URL_LIFETIME_MS);
  return 'opened';
}
