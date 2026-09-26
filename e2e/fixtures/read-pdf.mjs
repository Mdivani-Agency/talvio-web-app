import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

const require = createRequire(import.meta.url);
GlobalWorkerOptions.workerSrc = pathToFileURL(require.resolve('pdfjs-dist/build/pdf.worker.mjs')).href;
const standardFontDataUrl = pathToFileURL(`${dirname(require.resolve('pdfjs-dist/standard_fonts/FoxitSerif.pfb'))}/`).href;

const bytes = new Uint8Array(readFileSync(process.argv[2]));
const document = await getDocument({ data: bytes, standardFontDataUrl }).promise;
const pages = [];
for (let index = 1; index <= document.numPages; index += 1) {
  const page = await document.getPage(index);
  const content = await page.getTextContent();
  pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '));
}
process.stdout.write(JSON.stringify({ pages: document.numPages, text: pages.join('\n') }));
