import { Config, ResumePDFService, Template, templateFamilies, type FontFiles, type ResumeData } from '@pdf-tlv/resume';

import { resumeFonts, type FontFallback } from '@lib/pdf-templates/fonts';
import { siteOrigin } from '@lib/site';
import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, StandardFonts } from 'pdf-lib';

import { pdfSectionOrder } from '@lib/resume/section-order';
import { convertToResumeData, generateWithFontFallback, type FontState } from '@/lib/services/resume.service';
import type { ResumeForm } from '@lib/types';

/** Raised before upload and charge when the final PDF could not show the resume's own text. */
export class UnsupportedCharactersError extends Error {
  constructor(readonly characters: string[]) {
    super(`The PDF font cannot show these characters: ${characters.join(' ')}`);
    this.name = 'UnsupportedCharactersError';
  }
}

let standardCharset: Promise<Set<number>> | undefined;
const fontCharsets = new Map<string, Promise<Set<number>>>();

/** The characters the standard PDF font (Helvetica, WinAnsi) can encode. */
function standardFontCharset() {
  standardCharset ??= PDFDocument.create()
    .then((doc) => doc.embedFont(StandardFonts.Helvetica))
    .then((font) => new Set(font.getCharacterSet()));
  return standardCharset;
}

/** The characters a font file has glyphs for. Fetched once per server; a failed fetch is retried on the next PDF. */
function fontCharset(url: string) {
  let charset = fontCharsets.get(url);
  if (!charset) {
    charset = (async () => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
      const doc = await PDFDocument.create();
      doc.registerFontkit(fontkit);
      const font = await doc.embedFont(await response.arrayBuffer());
      return new Set(font.getCharacterSet());
    })().catch((error) => {
      fontCharsets.delete(url);
      throw error;
    });
    fontCharsets.set(url, charset);
  }
  return charset;
}

/**
 * The characters every font a render drew with can show. With the font files, that is what each family the template
 * uses has in common: IBM Plex Mono has no Greek, and Source Serif 4 lacks a few Latin letters Inter has. When any
 * family the template uses fell back to a standard font, the engine limits all text to the standard fonts' set. A
 * font file that cannot be read for the check counts as the standard set, so the check never lets more through.
 */
export async function renderCharset(template: Template, fallback: FontFallback, fonts: FontFiles): Promise<Set<number>> {
  const families = templateFamilies(template);
  if (fallback === 'none' || (fallback === 'body' && families.some((family) => family !== 'body'))) {
    return standardFontCharset();
  }
  const sets = await Promise.all(
    families.map((family) => {
      const url = fonts[family]?.fonts.regular;
      return url ? fontCharset(url).catch(() => standardFontCharset()) : standardFontCharset();
    }),
  );
  const [first = new Set<number>(), ...rest] = sets;
  return new Set([...first].filter((code) => rest.every((set) => set.has(code))));
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

/** Where the server fetches the app's own font files (`public/fonts`): this deployment, else the public site. */
function appOrigin(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL?.trim() || siteOrigin()).replace(/\/$/, '');
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
  const font: FontState = { fallback: 'all' };
  const fonts = resumeFonts(appOrigin());
  const bytes = await generateWithFontFallback(service, {
    data: resumeData,
    template,
    options: {
      ...(options.color ? { color: options.color } : {}),
      ...(options.fontSize ? { fontSize: options.fontSize } : {}),
      ...(options.colors ? { colors: options.colors } : {}),
    },
    sectionOrder: pdfSectionOrder(data.sectionOrder),
  }, font, fonts);
  // A paid PDF must show the resume's own text. 0.4.0 draws what a font lacks as "?" (standard font) or an empty box
  // (custom font) instead of failing as 0.2.3 did, so check the fonts the render used and fail before upload and charge.
  const charset = await renderCharset(template, font.fallback, fonts);
  const missing = unsupportedCharacters(resumeData, charset);
  if (missing.length > 0) {
    throw new UnsupportedCharactersError(missing);
  }
  return bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes as ArrayBuffer);
}
