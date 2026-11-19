import { describe, expect, it } from 'vitest';

import { releaseGateFailure } from '../scripts/release-gate.mjs';

const allPassed = {
  quality: 'success',
  'db-tests': 'success',
  'local-e2e': 'success',
};

describe('release gate', () => {
  it('passes only when quality, database tests and local end-to-end all succeed', () => {
    expect(releaseGateFailure(allPassed)).toBeNull();
  });

  it('names each job that failed, was skipped or was cancelled', () => {
    expect(releaseGateFailure({ ...allPassed, 'db-tests': 'failure' })).toContain('Not successful: db-tests.');
    expect(releaseGateFailure({ ...allPassed, 'local-e2e': 'skipped' })).toContain('Not successful: local-e2e.');
    expect(releaseGateFailure({ ...allPassed, quality: 'failure' })).toContain('Not successful: quality.');
    expect(
      releaseGateFailure({
        quality: 'cancelled',
        'db-tests': 'cancelled',
        'local-e2e': 'cancelled',
      }),
    ).toContain('Not successful: quality, db-tests, local-e2e.');
  });

  it('fails when a result is missing', () => {
    expect(releaseGateFailure({ quality: 'success', 'local-e2e': 'success' })).toContain('Not successful: db-tests.');
  });
});
