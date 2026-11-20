import { Config, ResumePDFService, Template, type ResumeData } from '@pdf-tlv/resume';
import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, StandardFonts } from 'pdf-lib';

import { pdfSectionOrder } from '@lib/resume/section-order';
import { convertToResumeData, generateWithFontFallback, RESUME_PDF_FONT } from '@/lib/services/resume.service';
import type { ResumeForm } from '@lib/types';

/** Raised before upload and charge when the final PDF could not show the resume's own text. */
export class UnsupportedCharactersError extends Error {
  constructor(readonly characters: string[]) {
    super(`The PDF font cannot show these characters: ${characters.join(' ')}`);
    this.name = 'UnsupportedCharactersError';
  }
}

let standardCharset: Promise<Set<number>> | undefined;
let interCharset: Promise<Set<number>> | undefined;

/** The characters the standard PDF font (Helvetica, WinAnsi) can encode. */
function standardFontCharset() {
  standardCharset ??= PDFDocument.create()
    .then((doc) => doc.embedFont(StandardFonts.Helvetica))
    .then((font) => new Set(font.getCharacterSet()));
  return standardCharset;
}

/** The characters Inter has glyphs for. Fetched once per server; a failed fetch is retried on the next PDF. */
function interFontCharset() {
  interCharset ??= (async () => {
    const response = await fetch(RESUME_PDF_FONT.fonts.regular);
    if (!response.ok) throw new Error(`Inter: HTTP ${response.status}`);
    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit);
    const font = await doc.embedFont(await response.arrayBuffer());
    return new Set(font.getCharacterSet());
  })().catch((error) => {
    interCharset = undefined;
    throw error;
  });
  return interCharset;
}

function collectStrings(value: unknown, out: string[]) {
  if (typeof value === 'string') {
    out.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out);
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectStrings(item, out);
  }
}

/** Characters in the resume text that a font with this character set cannot show. */
export function unsupportedCharacters(data: ResumeData, charset: Set<number>): string[] {
  const strings: string[] = [];
  collectStrings(data, strings);
  const missing = new Set<string>();
  for (const text of strings) {
    for (const char of text.normalize('NFC')) {
      if (!/\s/.test(char) && !charset.has(char.codePointAt(0)!)) missing.add(char);
    }
  }
  return [...missing];
}

/** Characters in the resume text that the standard font would draw as `?`. */
export async function unsupportedStandardCharacters(data: ResumeData): Promise<string[]> {
  return unsupportedCharacters(data, await standardFontCharset());
}

export async function generateResumePdfBytes(
  data: ResumeForm,
  template: Template,
  options: Partial<Config> = {},
): Promise<Uint8Array> {
  const service = new ResumePDFService();
  await service.create({
    color: options.color ?? '#000000',
    fontSize: options.fontSize ?? 'md',
    leading: 'md',
    isPreview: false,
  });
  const resumeData = convertToResumeData(data);
  const font = { fontUnavailable: false };
  const bytes = await generateWithFontFallback(service, {
    data: resumeData,
    template,
    options: {
      ...(options.color ? { color: options.color } : {}),
      ...(options.fontSize ? { fontSize: options.fontSize } : {}),
      ...(options.colors ? { colors: options.colors } : {}),
    },
    sectionOrder: pdfSectionOrder(data.sectionOrder),
  }, font);
  // A paid PDF must show the resume's own text. 0.4.0 draws what the font lacks as "?" (standard font) or an empty box
  // (Inter) instead of failing as 0.2.3 did, so check the font the render used and fail before upload and charge.
  const charset = font.fontUnavailable
    ? await standardFontCharset()
    : await interFontCharset().catch(() => standardFontCharset());
  const missing = unsupportedCharacters(resumeData, charset);
  if (missing.length > 0) {
    throw new UnsupportedCharactersError(missing);
  }
  return bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes as ArrayBuffer);
}
