import { interFont, type CustomFont, type FontFiles } from '@pdf-tlv/resume';

/**
 * Font files for the three typeface roles the templates use (all SIL OFL). The engine ships none: it embeds only the
 * roles a template draws with, and a role without files falls back to Helvetica, Times or Courier.
 *
 * Source Serif 4 and IBM Plex Mono are served by the app itself from `public/fonts` (see the README there): no
 * third-party font host, and Plex Mono as TrueType, because a WOFF embedded in a PDF is not a valid font file. Inter is
 * the engine's bundled `interFont` (Google Fonts), as before.
 */
const file = (origin: string, name: string) => `${origin}/fonts/${name}.ttf`;

function serif(origin: string): CustomFont {
  return {
    name: 'Source Serif 4',
    fonts: {
      regular: file(origin, 'SourceSerif4-Regular'),
      semibold: file(origin, 'SourceSerif4-Semibold'),
      bold: file(origin, 'SourceSerif4-Bold'),
      italic: file(origin, 'SourceSerif4-It'),
      'bold-italic': file(origin, 'SourceSerif4-BoldIt'),
    },
  };
}

function mono(origin: string): CustomFont {
  return {
    name: 'IBM Plex Mono',
    fonts: {
      regular: file(origin, 'IBMPlexMono-Regular'),
      semibold: file(origin, 'IBMPlexMono-SemiBold'),
      bold: file(origin, 'IBMPlexMono-Bold'),
      italic: file(origin, 'IBMPlexMono-Italic'),
      'bold-italic': file(origin, 'IBMPlexMono-BoldItalic'),
    },
  };
}

/**
 * Inter for body text, Source Serif 4 for `serif`, IBM Plex Mono for `mono`. `origin` is empty in the browser, where
 * `/fonts/...` resolves against the page; the server passes the app's own origin.
 */
export function resumeFonts(origin = ''): FontFiles {
  return { body: interFont, serif: serif(origin), mono: mono(origin) };
}

/** For the browser preview. */
export const RESUME_FONTS: FontFiles = resumeFonts();

/** Steps of the font fallback: every role, then Inter only, then the standard fonts. */
export const FONT_FALLBACKS = ['all', 'body', 'none'] as const;
export type FontFallback = (typeof FONT_FALLBACKS)[number];

export function fontsFor(fallback: FontFallback, fonts: FontFiles): FontFiles | undefined {
  if (fallback === 'all') return fonts;
  if (fallback === 'body') return { body: fonts.body };
  return undefined;
}
