import { PDFPage } from 'pdf-lib';
import { afterEach, describe, expect, it } from 'vitest';

import { profileToResumeDocument } from '@lib/models/resume-document';
import { TEMPLATE_LIST } from '@lib/templates';

import { fullAccountDto } from '../../test/fixtures/flow';
import { generateResumePdfBytes } from './resume-pdf.server';

const drawText = PDFPage.prototype.drawText;

/** Every string the renderer draws, in order. */
async function renderedText(...args: Parameters<typeof generateResumePdfBytes>) {
  const drawn: string[] = [];
  PDFPage.prototype.drawText = function (text, options) {
    drawn.push(text);
    return drawText.call(this, text, options);
  };
  await generateResumePdfBytes(...args);
  return drawn.join(' ');
}

describe('generateResumePdfBytes', () => {
  afterEach(() => {
    PDFPage.prototype.drawText = drawText;
  });

  it.each(TEMPLATE_LIST.senior.map((item) => [item.key, item.template] as const))(
    'draws the experience job description and every bullet in %s',
    async (_key, template) => {
      const resume = profileToResumeDocument(fullAccountDto);
      const text = await renderedText(resume, template, { color: '#000000', isPreview: false });

      expect(text).toContain('Platform group');
      expect(text).toContain('Shipped template gallery');
      expect(text).toContain('Cut PDF render time');
      expect(text).toContain('Owned the editor');
    },
  );
});
