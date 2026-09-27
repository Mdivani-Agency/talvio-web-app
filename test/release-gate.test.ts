import { describe, expect, it } from 'vitest';

import { releaseGateFailure } from '../scripts/release-gate.mjs';

describe('release gate', () => {
  it('passes only when quality and local end-to-end both succeed', () => {
    expect(releaseGateFailure('success', 'success')).toBeNull();
  });

  it('fails when either job fails, is skipped, or is cancelled', () => {
    expect(releaseGateFailure('success', 'failure')).toBe(
      'Release gate requires quality and local-e2e to succeed.',
    );
    expect(releaseGateFailure('failure', 'success')).toBe(
      'Release gate requires quality and local-e2e to succeed.',
    );
    expect(releaseGateFailure('success', 'skipped')).toBe(
      'Release gate requires quality and local-e2e to succeed.',
    );
    expect(releaseGateFailure('cancelled', 'cancelled')).toBe(
      'Release gate requires quality and local-e2e to succeed.',
    );
  });
});
