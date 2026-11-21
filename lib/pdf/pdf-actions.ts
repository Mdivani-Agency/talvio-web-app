'use client';

import { toast } from 'sonner';

import { PDF_ACTION_MESSAGES } from '@/lib/resume-editor-copy';

import { openPdf, savePdf, type PdfFile } from './save-pdf';

export type { PdfFile };

/** Download from a click: the save dialog where the browser has one, else a save under the file's name. */
export async function downloadPdf(file: PdfFile): Promise<boolean> {
  try {
    await savePdf(file);
    return true;
  } catch {
    toast.error(PDF_ACTION_MESSAGES.failed);
    return false;
  }
}

/**
 * Open in a new tab from a click. When the browser still blocks the tab, a toast offers Open PDF: clicking it is a new
 * click, which the browser allows.
 */
export async function openPdfInTab(file: PdfFile): Promise<boolean> {
  try {
    if ((await openPdf(file)) === 'opened') {
      return true;
    }
    toast.error(PDF_ACTION_MESSAGES.tabBlocked, {
      duration: 15_000,
      action: { label: PDF_ACTION_MESSAGES.openAnyway, onClick: () => void openPdfInTab(file) },
    });
    return false;
  } catch {
    toast.error(PDF_ACTION_MESSAGES.failed);
    return false;
  }
}
