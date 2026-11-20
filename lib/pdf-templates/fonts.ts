import { interFont, type CustomFont, type FontFiles } from '@pdf-tlv/resume';

/**
 * Open-licence (SIL OFL) font files for the three typeface roles the templates use. The engine ships none: it embeds
 * only the roles a template draws with, and a role without files falls back to Helvetica, Times or Courier.
 *
 * Source Serif 4 and IBM Plex Mono come from their makers' releases, pinned, through jsDelivr, as in the talv-pdf
 * playground: the Google Fonts builds of both fail in `@pdf-lib/fontkit` ("Trying to access beyond buffer length").
 */
const adobe = (file: string) =>
  `https://cdn.jsdelivr.net/gh/adobe-fonts/source-serif@4.005R/TTF/SourceSerif4-${file}.ttf`;
const ibm = (file: string) => `https://cdn.jsdelivr.net/npm/@ibm/plex-mono@2.5.0/fonts/complete/woff/IBMPlexMono-${file}.woff`;

export const sourceSerifFont: CustomFont = {
  name: 'Source Serif 4',
  fonts: {
    regular: adobe('Regular'),
    semibold: adobe('Semibold'),
    bold: adobe('Bold'),
    italic: adobe('It'),
    'bold-italic': adobe('BoldIt'),
  },
};

export const plexMonoFont: CustomFont = {
  name: 'IBM Plex Mono',
  fonts: {
    regular: ibm('Regular'),
    semibold: ibm('SemiBold'),
    bold: ibm('Bold'),
    italic: ibm('Italic'),
    'bold-italic': ibm('BoldItalic'),
  },
};

/** Inter for body text, Source Serif 4 for `serif`, IBM Plex Mono for `mono`. */
export const RESUME_FONTS: FontFiles = { body: interFont, serif: sourceSerifFont, mono: plexMonoFont };
