import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export async function readPdfText(bytes: Uint8Array) {
  if (bytes.length < 5 || String.fromCharCode(...bytes.subarray(0, 5)) !== '%PDF-') {
    throw new Error('Downloaded file is not a PDF');
  }
  const directory = await mkdtemp(join(tmpdir(), 'talvio-pdf-'));
  const file = join(directory, 'resume.pdf');
  await writeFile(file, bytes);
  try {
    const stdout = await new Promise<string>((resolve, reject) => {
      execFile(
        process.execPath,
        [join(process.cwd(), 'e2e/fixtures/read-pdf.mjs'), file],
        { cwd: process.cwd() },
        (error, out, err) => {
          if (error) {
            reject(new Error(err || error.message));
            return;
          }
          resolve(out);
        },
      );
    });
    return JSON.parse(stdout) as { pages: number; text: string };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

export async function fetchPdfText(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not download ${url}: ${response.status}`);
  }
  return readPdfText(new Uint8Array(await response.arrayBuffer()));
}
