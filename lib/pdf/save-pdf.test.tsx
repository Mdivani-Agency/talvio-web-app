import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchPdfBlob, openPdf, pdfFilename, savePdf } from './save-pdf';

const FILE = { url: 'https://media.example.test/resume/u/ada-owner.pdf', name: 'Ada Owner' };
const calls: string[] = [];

// jsdom's Blob is not the one Node's Response reads, so the fake response hands back a jsdom Blob.
function pdfResponse(status = 200) {
  return { ok: status < 400, status, blob: async () => new Blob(['%PDF-1.7'], { type: 'application/pdf' }) };
}

function namedError(name: string) {
  return Object.assign(new Error(name), { name });
}

describe('save-pdf', () => {
  let clicked: { href: string; download: string }[];

  beforeEach(() => {
    calls.length = 0;
    clicked = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        calls.push('fetch');
        return pdfResponse();
      }),
    );
    URL.createObjectURL = vi.fn(() => 'blob:https://talvio.test/1');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push({ href: this.href, download: this.download });
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete (window as { showSaveFilePicker?: unknown }).showSaveFilePicker;
  });

  it('names the file after the resume, with one .pdf', () => {
    expect(pdfFilename('Ada Owner')).toBe('Ada Owner.pdf');
    expect(pdfFilename('Ada Owner.PDF')).toBe('Ada Owner.PDF');
    expect(pdfFilename('  ')).toBe('resume.pdf');
  });

  it('fails when the PDF cannot be read', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => pdfResponse(404)));
    await expect(fetchPdfBlob(FILE.url)).rejects.toThrow('404');
  });

  describe('savePdf', () => {
    it('asks where to save before fetching, then writes the file there', async () => {
      const write = vi.fn(async () => undefined);
      const close = vi.fn(async () => undefined);
      const picker = vi.fn(async () => {
        calls.push('picker');
        return { createWritable: async () => ({ write, close }) };
      });
      (window as { showSaveFilePicker?: unknown }).showSaveFilePicker = picker;

      await expect(savePdf(FILE)).resolves.toBe('saved');

      expect(calls).toEqual(['picker', 'fetch']);
      expect(picker).toHaveBeenCalledWith(expect.objectContaining({ suggestedName: 'Ada Owner.pdf' }));
      expect(write).toHaveBeenCalledWith(expect.any(Blob));
      expect(close).toHaveBeenCalled();
      expect(clicked).toEqual([]);
    });

    it('does nothing more when the user closes the save dialog', async () => {
      (window as { showSaveFilePicker?: unknown }).showSaveFilePicker = vi.fn(async () => {
        throw namedError('AbortError');
      });

      await expect(savePdf(FILE)).resolves.toBe('cancelled');
      expect(calls).toEqual([]);
      expect(clicked).toEqual([]);
    });

    it('saves under the file name when the dialog is not allowed any more', async () => {
      (window as { showSaveFilePicker?: unknown }).showSaveFilePicker = vi.fn(async () => {
        throw namedError('SecurityError');
      });

      await expect(savePdf(FILE)).resolves.toBe('saved');
      expect(clicked).toEqual([{ href: 'blob:https://talvio.test/1', download: 'Ada Owner.pdf' }]);
    });

    it('falls back to the file URL when the PDF cannot be read from this page', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }));

      await expect(savePdf(FILE)).resolves.toBe('saved');
      expect(clicked).toEqual([{ href: FILE.url, download: 'Ada Owner.pdf' }]);
    });

    it('saves a same-origin copy under the file name in a browser without a save dialog', async () => {
      await expect(savePdf(FILE)).resolves.toBe('saved');

      expect(fetch).toHaveBeenCalledWith(FILE.url, { cache: 'no-store' });
      // A blob URL is same-origin, so the browser keeps the name instead of opening the PDF.
      expect(clicked).toEqual([{ href: 'blob:https://talvio.test/1', download: 'Ada Owner.pdf' }]);
    });
  });

  describe('openPdf', () => {
    it('opens the tab first, then shows the fetched PDF in it', async () => {
      const tab = { opener: {}, document: window.document.implementation.createHTMLDocument(''), location: { href: '' }, close: vi.fn() };
      const open = vi.spyOn(window, 'open').mockImplementation(() => {
        calls.push('open');
        return tab as unknown as Window;
      });

      await expect(openPdf(FILE)).resolves.toBe('opened');

      expect(open).toHaveBeenCalledWith('', '_blank');
      expect(calls).toEqual(['open', 'fetch']);
      expect(tab.opener).toBeNull();
      expect(tab.location.href).toBe('blob:https://talvio.test/1');
      expect(tab.close).not.toHaveBeenCalled();
    });

    it('reports a blocked tab without fetching', async () => {
      vi.spyOn(window, 'open').mockReturnValue(null);

      await expect(openPdf(FILE)).resolves.toBe('blocked');
      expect(calls).toEqual([]);
    });

    it('loads the file itself in the tab when the PDF cannot be read from this page', async () => {
      const tab = { opener: {}, document: window.document.implementation.createHTMLDocument(''), location: { href: '' }, close: vi.fn() };
      vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);
      vi.stubGlobal('fetch', vi.fn(async () => pdfResponse(403)));

      await expect(openPdf(FILE)).resolves.toBe('opened');
      expect(tab.location.href).toBe(FILE.url);
      expect(tab.close).not.toHaveBeenCalled();
    });
  });
});
