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

  it('rejects an empty report, a skip, a missing case, and an unexpected project', () => {
    expect(assertE2EResults({ suites: [] }, expected)).toEqual([
      'Playwright report has no tests',
      'Missing Playwright project chromium',
      'Missing required test AUTH-01 signs in',
      'Missing required test PDF-01 downloads',
    ]);

    expect(assertE2EResults(report([
      { title: 'AUTH-01 signs in', status: 'skipped', outcome: 'skipped' },
      { title: 'PDF-01 downloads' },
    ]), expected)).toEqual([
      'AUTH-01 signs in [chromium] status=skipped outcome=skipped',
    ]);

    expect(assertE2EResults(report([
      { title: 'PDF-01 downloads' },
    ]), expected)).toContain('Missing required test AUTH-01 signs in');

    expect(assertE2EResults(report([
      { title: 'AUTH-01 signs in', project: 'firefox' },
      { title: 'PDF-01 downloads' },
    ]), expected)).toEqual([
      'AUTH-01 signs in ran in unexpected project firefox',
      'Missing required test AUTH-01 signs in',
    ]);
  });
});
