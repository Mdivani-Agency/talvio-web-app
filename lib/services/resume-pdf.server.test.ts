import { PDFPage } from 'pdf-lib';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { profileToResumeDocument } from '@lib/models/resume-document';
import { TEMPLATE_LIST } from '@lib/templates';

import { fullAccountDto } from '../../test/fixtures/flow';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { resumeFonts } from '@lib/pdf-templates/fonts';

import {
  generateResumePdfBytes,
  printedData,
  renderCharset,
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

describe('printedData', () => {
  const data = {
    name: 'Ada',
    headlineAchievements: [{ value: '3', label: '增长' }],
    skillGroups: [{ name: 'Languages', skills: ['TypeScript'] }],
    experience: [{ company: 'Northwind', stack: ['Go'], kind: 'experience' }],
  };

  it('leaves out the optional fields a template never prints', async () => {
    const { classic, executive, technical } = await import('@lib/pdf-templates');
    const forClassic = printedData(data as never, classic);
    expect(forClassic).not.toHaveProperty('headlineAchievements');
    expect(forClassic.experience?.[0]).not.toHaveProperty('stack');
    expect(forClassic.experience?.[0]).toHaveProperty('company', 'Northwind');
    expect(unsupportedCharacters(forClassic, new Set([...'AdaLanguagesTypeScriptNorthwindexperience'].map((c) => c.codePointAt(0)!)))).toEqual([]);

    expect(printedData(data as never, executive)).toHaveProperty('headlineAchievements');
    const forTechnical = printedData(data as never, technical);
    expect(forTechnical).toHaveProperty('skillGroups');
    expect(forTechnical.experience?.[0]).toHaveProperty('stack', ['Go']);
  });
});

describe('renderCharset', () => {
  /** Serves `public/fonts` from disk; Inter is fetched as in the app. */
  const serveLocalFonts = () => {
    const realFetch = globalThis.fetch;
    return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      const local = /^https:\/\/fonts\.test(\/fonts\/.+\.ttf)$/.exec(url)?.[1];
      return local ? new Response(await readFile(resolve('public', `.${local}`))) : realFetch(input, init);
    });
  };
  const fonts = resumeFonts('https://fonts.test');
  const code = (char: string) => char.codePointAt(0)!;

  it('keeps only the characters every font of the template has', async () => {
    const { technical, classic } = await import('@lib/pdf-templates');
    const fetchSpy = serveLocalFonts();
    try {
      // Technical sets text in IBM Plex Mono, which has no Greek; Inter alone has it.
      const mono = await renderCharset(technical, 'all', fonts);
      expect(mono.has(code('A'))).toBe(true);
      expect(mono.has(code('Ж'))).toBe(true);
      expect(mono.has(code('α'))).toBe(false);
      expect((await renderCharset(technical, 'body', fonts)).has(code('Ж'))).toBe(false);

      // Classic is Source Serif 4, which has Greek.
      expect((await renderCharset(classic, 'all', fonts)).has(code('α'))).toBe(true);
    } finally {
      fetchSpy.mockRestore();
    }
  }, 60_000);

  it('counts a font file it cannot read as the standard set', async () => {
    const { technical } = await import('@lib/pdf-templates');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fetch failed'));
    try {
      const charset = await renderCharset(technical, 'all', resumeFonts('https://unreachable.test'));
      expect(charset.has(code('é'))).toBe(true);
      expect(charset.has(code('Ж'))).toBe(false);
    } finally {
      fetchSpy.mockRestore();
    }
  });
});

describe('unsupportedStandardCharacters', () => {
  it('lists the characters Helvetica cannot encode, ignoring whitespace', async () => {
    expect(
      await unsupportedStandardCharacters({ name: 'Zoë Ödegaard', role: 'Engineer 文\u00a0' }),
    ).toEqual(['文']);
  });

  it('checks a serif template against the standard fonts after the font fallback', async () => {
    const { executive } = await import('@lib/pdf-templates');
    const resume = { ...profileToResumeDocument(fullAccountDto) };
    resume.profile = { ...resume.profile, role: 'Инженер' };
    // Without the font files, every role falls back to the standard fonts, which cannot show it.
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fetch failed'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      await expect(generateResumePdfBytes(resume, executive, { color: '#000000' })).rejects.toBeInstanceOf(
        UnsupportedCharactersError,
      );
    } finally {
      fetchSpy.mockRestore();
      warn.mockRestore();
    }
  }, 60_000);
});
