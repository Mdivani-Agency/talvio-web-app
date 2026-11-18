/** The parts of a pdf.js text item the page text is built from. */
export type PdfTextItem = {
  str: string;
  hasEOL?: boolean;
  /** [a, b, c, d, x, y]: x and y place the item's start on the page. */
  transform?: number[];
  width?: number;
  height?: number;
};

const WHITESPACE = /\s/;

/**
 * A page's text as it reads: items in order, a line break where pdf.js reports the end of a line
 * or the baseline moves, and a space between items on one line that are apart without one.
 *
 * The LLM service only keeps values it can find in this text (grounding allows any whitespace
 * between words, never other characters), so lines must not be glued with commas or with nothing:
 * a wrapped summary or bullet would then never match what the model copied.
 */
export function pageText(items: readonly PdfTextItem[]): string {
  let text = '';
  let previous: PdfTextItem | null = null;
  for (const item of items) {
    if (previous && !text.endsWith('\n')) {
      const [, , , , prevX = 0, prevY = 0] = previous.transform ?? [];
      const [, , , , x = 0, y = 0] = item.transform ?? [];
      const lineHeight = Math.max(previous.height ?? 0, item.height ?? 0, 1);
      if (previous.transform && item.transform && Math.abs(y - prevY) > lineHeight / 2) {
        text += '\n';
      } else if (
        previous.transform &&
        item.transform &&
        item.str &&
        !WHITESPACE.test(item.str[0]!) &&
        text &&
        !WHITESPACE.test(text.at(-1)!) &&
        x - (prevX + (previous.width ?? 0)) > lineHeight * 0.15
      ) {
        text += ' ';
      }
    }
    text += item.str;
    if (item.hasEOL && !text.endsWith('\n')) {
      text += '\n';
    }
    if (item.str || item.hasEOL) {
      previous = item;
    }
  }
  return text.replace(/[ \t]+\n/g, '\n').trimEnd();
}
