import { describe, expect, it } from 'vitest';

import fixture from '../../test/fixtures/llm/parse-result-partial-profile.json';
import type { ResultEnvelope } from './contract';
import { importedAccount, importTextProblem, partialDateToIso, pdfTextRequest } from './parse-document';

/** talvio-llm-service contracts `fixtures/valid/parse-result-partial-profile.json`. */
const PARTIAL = fixture.payload as unknown as ResultEnvelope;

function envelope(career: Record<string, unknown>, patch: Partial<ResultEnvelope> = {}): ResultEnvelope {
  const base = (PARTIAL.result as { career: Record<string, unknown> }).career;
  return {
    ...PARTIAL,
    resultKind: 'complete',
    warnings: [],
    result: {
      career: { ...base, ...career },
      facts: [],
      uncertainties: [],
      extraction: { method: 'plain_text', ocrPages: 0, complete: true, pagesNeedingReview: [] },
    },
    ...patch,
  };
}

describe('parse_document import', () => {
  it('builds the page manifest from PDF text', () => {
    const { text, extraction } = pdfTextRequest(['Ada Owner', '', 'Engineer'], '4.10.38');
    expect(text).toBe('Ada Owner\n\nEngineer');
    expect(extraction).toEqual({
      extractor: 'pdfjs-dist',
      extractorVersion: '4.10.38',
      pageCount: 3,
      pages: [
        { page: 1, start: 0, end: 9, coverage: 'text' },
        { page: 2, start: 10, end: 10, coverage: 'empty' },
        { page: 3, start: 11, end: 19, coverage: 'text' },
      ],
    });
    expect(text.slice(extraction.pages[2]!.start, extraction.pages[2]!.end)).toBe('Engineer');
  });

  it('refuses empty, overlong or too many pages before any request', () => {
    expect(importTextProblem('  ')).toMatch(/could not find any text/);
    expect(importTextProblem('x'.repeat(100_001))).toMatch(/too long/);
    expect(importTextProblem('text', 31)).toMatch(/31 pages/);
    expect(importTextProblem('text', 30)).toBeNull();
  });

  it('reads partial dates and says when a month was assumed', () => {
    expect(partialDateToIso('2021-03')).toEqual({ iso: '2021-03-01T00:00:00.000Z', widened: false });
    expect(partialDateToIso('2021-03-15')).toEqual({ iso: '2021-03-15T00:00:00.000Z', widened: false });
    expect(partialDateToIso('2019')).toEqual({ iso: '2019-01-01T00:00:00.000Z', widened: true });
    expect(partialDateToIso(null)).toBeNull();
    expect(partialDateToIso('March 2021')).toBeNull();
  });

  it('imports the contract fixture and keeps its gaps visible', () => {
    const { account, review } = importedAccount(PARTIAL);
    expect(account.profile).toMatchObject({ firstName: 'Nino', lastName: 'Beridze', role: 'Senior Backend Engineer', email: '' });
    expect(account.experience).toEqual([
      expect.objectContaining({
        company: 'Acme',
        startDate: '2021-03-01T00:00:00.000Z',
        endDate: undefined,
        // The service did not say the role is current, so it is not marked current.
        isPresent: false,
        achievements: ['Cut checkout latency by 40%'],
      }),
      expect.objectContaining({ company: 'Globex', startDate: '2018-01-01T00:00:00.000Z', endDate: '2021-02-01T00:00:00.000Z' }),
    ]);
    expect(review.partial).toBe(true);
    expect(review.items).toEqual(
      expect.arrayContaining([
        { section: 'Experience', message: expect.stringMatching(/Senior Backend Engineer, Acme: no end date/) },
        { section: 'Experience', message: expect.stringMatching(/Backend Engineer, Globex start: only the year/) },
        { section: 'Experience', message: 'No end date given; not marked as current.' },
        { section: 'document', message: 'Page 2 could not be read completely. Check what was imported from it.' },
      ]),
    );
  });

  it('leaves out and lists what the form cannot hold without a guess', () => {
    const { account, review } = importedAccount(
      envelope({
        experience: [
          {
            id: 'parsed:experience:0',
            company: 'Acme',
            jobTitle: 'Engineer',
            employmentType: 'full-time',
            locationType: 'remote',
            startDate: null,
            endDate: null,
            current: null,
            description: { type: 'doc', blocks: [{ type: 'paragraph', content: [{ text: 'Built things' }] }] },
            achievements: [],
            responsibilities: [],
            keyContributions: [],
          },
        ],
        education: [
          { id: 'parsed:education:0', name: 'MIT', degreeType: null, startDate: '2010', endDate: '2014', current: false, description: null },
        ],
        languages: [{ id: 'parsed:languages:0', language: 'Georgian', proficiency: null }],
        skills: [{ id: 'parsed:skills:0', name: 'Go' }],
      }),
    );
    expect(account.experience).toEqual([]);
    expect(account.education).toEqual([]);
    expect(account.languages).toEqual([]);
    expect(account.skills).toEqual([{ name: 'Go' }]);
    expect(review.partial).toBe(false);
    expect(review.items.map((item) => item.message)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/Engineer, Acme was not imported: its start date/),
        expect.stringMatching(/MIT was not imported: its degree type/),
        'Georgian: choose how well you speak it.',
      ]),
    );
  });

  it('keeps description text as one line per paragraph or item', () => {
    const { account } = importedAccount(
      envelope({
        experience: [
          {
            id: 'parsed:experience:0',
            company: 'Acme',
            jobTitle: 'Engineer',
            employmentType: null,
            locationType: null,
            startDate: '2020-01',
            endDate: null,
            current: true,
            description: {
              type: 'doc',
              blocks: [
                { type: 'paragraph', content: [{ text: 'Led ' }, { text: 'payments', marks: ['bold'] }] },
                { type: 'bulletList', items: [[{ text: 'Shipped v2' }], [{ text: 'Hired 3' }]] },
              ],
            },
            achievements: [],
            responsibilities: [],
            keyContributions: [],
          },
        ],
      }),
    );
    expect(account.experience?.[0]).toMatchObject({ additionalDetails: 'Led payments\nShipped v2\nHired 3', isPresent: true });
  });
});
