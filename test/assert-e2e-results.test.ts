import { describe, expect, it } from 'vitest';

import { assertE2EResults } from '../scripts/assert-e2e-results.mjs';

const expected = {
  projects: ['chromium'],
  tests: ['AUTH-01 signs in', 'PDF-01 downloads'],
};

function report(tests: Array<{ title: string; project?: string; status?: string; outcome?: string }>) {
  return {
    suites: [
      {
        specs: tests.map((test) => ({
          title: test.title,
          tests: [
            {
              projectName: test.project ?? 'chromium',
              status: test.outcome ?? 'expected',
              results: [{ status: test.status ?? 'passed' }],
            },
          ],
        })),
      },
    ],
  };
}

describe('Playwright result manifest', () => {
  it('accepts the required passing tests', () => {
    expect(assertE2EResults(report([
      { title: 'AUTH-01 signs in' },
      { title: 'PDF-01 downloads' },
    ]), expected)).toEqual([]);
  });

  it('requires a focused mobile case only in its project', () => {
    const withMobile = {
      ...expected,
      focused: [{
        project: 'mobile-chromium',
        tests: ['UX-02 stays on screen'],
      }],
    };
    expect(assertE2EResults(report([
      { title: 'AUTH-01 signs in' },
      { title: 'PDF-01 downloads' },
      { title: 'UX-02 stays on screen', project: 'mobile-chromium' },
    ]), withMobile)).toEqual([]);
    expect(assertE2EResults(report([
      { title: 'AUTH-01 signs in' },
      { title: 'PDF-01 downloads' },
    ]), withMobile)).toEqual([
      'Missing Playwright project mobile-chromium',
      'Missing required test UX-02 stays on screen [mobile-chromium]',
    ]);
  });

  it('rejects an empty report, a skip, a missing case, and an unexpected project', () => {
    expect(assertE2EResults({ suites: [] }, expected)).toEqual([
      'Playwright report has no tests',
      'Missing Playwright project chromium',
      'Missing required test AUTH-01 signs in [chromium]',
      'Missing required test PDF-01 downloads [chromium]',
    ]);

    expect(assertE2EResults(report([
      { title: 'AUTH-01 signs in', status: 'skipped', outcome: 'skipped' },
      { title: 'PDF-01 downloads' },
    ]), expected)).toEqual([
      'AUTH-01 signs in [chromium] status=skipped outcome=skipped',
    ]);

    expect(assertE2EResults(report([
      { title: 'PDF-01 downloads' },
    ]), expected)).toContain('Missing required test AUTH-01 signs in [chromium]');

    expect(assertE2EResults(report([
      { title: 'AUTH-01 signs in', project: 'firefox' },
      { title: 'PDF-01 downloads' },
    ]), expected)).toEqual([
      'AUTH-01 signs in ran in unexpected project firefox',
      'Missing required test AUTH-01 signs in [chromium]',
    ]);

    expect(assertE2EResults(report([
      { title: 'AUTH-01 signs in' },
      { title: 'PDF-01 downloads' },
    ]), {
      ...expected,
      projects: ['chromium', 'firefox'],
    })).toEqual([
      'Missing Playwright project firefox',
      'Missing required test AUTH-01 signs in [firefox]',
      'Missing required test PDF-01 downloads [firefox]',
    ]);
  });
});
