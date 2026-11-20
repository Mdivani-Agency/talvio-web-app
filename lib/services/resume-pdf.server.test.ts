import { PDFPage } from 'pdf-lib';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { profileToResumeDocument } from '@lib/models/resume-document';
import { TEMPLATE_LIST } from '@lib/templates';

import { fullAccountDto } from '../../test/fixtures/flow';
import {
  generateResumePdfBytes,
  unsupportedCharacters,
  UnsupportedCharactersError,
  unsupportedStandardCharacters,
} from './resume-pdf.server';

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

  // Talvio keeps education in its side column, so there projects move ahead of experience in the main column.
  it.each(TEMPLATE_LIST.senior.map((item) => [item.key, item.template] as const))(
    'draws the sections in the resume order in %s, and in the template order without one',
    async (key, template) => {
      const resume = profileToResumeDocument(fullAccountDto);
      const moved = key.endsWith('talvio') ? 'projects' : 'education';
      const movedText = (moved === 'projects' ? resume.projects?.[0]?.name : resume.education?.[0]?.name) ?? '';
      const company = resume.experience?.[0]?.company ?? '';
      expect(movedText && company).toBeTruthy();

      const before = await renderedText(resume, template, { color: '#000000' });
      expect(before.indexOf(company)).toBeLessThan(before.indexOf(movedText));

      const reordered = await renderedText({ ...resume, sectionOrder: [moved, 'experience'] }, template, {
        color: '#000000',
      });
      expect(reordered.indexOf(movedText)).toBeLessThan(reordered.indexOf(company));
    },
  );

  it('refuses a final PDF on the standard font when it cannot show the resume text', async () => {
    // No network for Inter: the render falls back to Helvetica, which would print "文" as "?".
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fetch failed'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      const resume = { ...profileToResumeDocument(fullAccountDto) };
      resume.profile = { ...resume.profile, role: '文' };
      await expect(generateResumePdfBytes(resume, TEMPLATE_LIST.senior[0]!.template)).rejects.toBeInstanceOf(
        UnsupportedCharactersError,
      );

      // Western European text still renders on the standard font.
      const latin = { ...resume, profile: { ...resume.profile, role: 'Ingénieure' } };
      await expect(generateResumePdfBytes(latin, TEMPLATE_LIST.senior[0]!.template)).resolves.toBeInstanceOf(Uint8Array);
    } finally {
      fetchSpy.mockRestore();
      warn.mockRestore();
    }
  });
});

describe('unsupportedCharacters', () => {
  it('checks against the character set of the font the render used', () => {
    const latinAndCyrillic = new Set([...'AdaИван'].map((char) => char.codePointAt(0)!));
    expect(unsupportedCharacters({ name: 'Ada Иван', role: '文' }, latinAndCyrillic)).toEqual(['文']);
  });
});

describe('unsupportedStandardCharacters', () => {
  it('lists the characters Helvetica cannot encode, ignoring whitespace', async () => {
    expect(
      await unsupportedStandardCharacters({ name: 'Zoë Ödegaard', role: 'Engineer 文\u00a0' }),
    ).toEqual(['文']);
  });
});
