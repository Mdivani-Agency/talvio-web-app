import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

const require = createRequire(import.meta.url);
GlobalWorkerOptions.workerSrc = pathToFileURL(require.resolve('pdfjs-dist/build/pdf.worker.mjs')).href;
const standardFontDataUrl = pathToFileURL(`${dirname(require.resolve('pdfjs-dist/standard_fonts/FoxitSerif.pfb'))}/`).href;

export async function readPdfText(bytes: Uint8Array) {
  if (bytes.length < 5 || String.fromCharCode(...bytes.subarray(0, 5)) !== '%PDF-') {
    throw new Error('Downloaded file is not a PDF');
  }
  const document = await getDocument({ data: bytes, standardFontDataUrl }).promise;
  const pages: string[] = [];
  for (let index = 1; index <= document.numPages; index += 1) {
    const page = await document.getPage(index);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '));
  }
  return { pages: document.numPages, text: pages.join('\n') };
}

export async function fetchPdfText(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not download ${url}: ${response.status}`);
  }
  return readPdfText(new Uint8Array(await response.arrayBuffer()));
}
