import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  RELEASE_GATE_JOB_NAME,
  inFlightRunFailure,
  releaseGateJobFailure,
} from '../scripts/require-ci-release-gate.mjs';

const SHA = 'a'.repeat(40);

describe('manual migration preflight', () => {
  it('allows a dispatch when every CI push run on the branch has completed', () => {
    expect(
      inFlightRunFailure([
        { id: 2, status: 'completed' },
        { id: 1, status: 'completed' },
      ]),
    ).toBeNull();
  });

  it('refuses while a CI push run is queued, waiting, or in progress', () => {
    for (const status of ['queued', 'waiting', 'in_progress', 'pending']) {
      expect(inFlightRunFailure([{ id: 7, status }, { id: 6, status: 'completed' }])).toBe(
        `Refusing manual migration: CI run 7 on this branch is ${status}. Let it finish, then retry.`,
      );
    }
  });

  it('allows a commit whose release gate succeeded', () => {
    expect(
      releaseGateJobFailure(SHA, { id: 9 }, [
        { name: 'Push migrations / Push migrations', conclusion: 'failure' },
        { name: RELEASE_GATE_JOB_NAME, conclusion: 'success' },
      ]),
    ).toBeNull();
  });

  it('refuses a commit without a CI run or without a passed release gate', () => {
    expect(releaseGateJobFailure(SHA, undefined, [])).toBe(
      `Refusing manual migration: no CI push run found for ${SHA}.`,
    );
    expect(
      releaseGateJobFailure(SHA, { id: 9 }, [{ name: RELEASE_GATE_JOB_NAME, conclusion: 'failure' }]),
    ).toBe('Refusing manual migration: CI run 9 release gate is failure, not success.');
    expect(releaseGateJobFailure(SHA, { id: 9 }, [])).toBe(
      'Refusing manual migration: CI run 9 release gate is missing, not success.',
    );
  });

  it('matches the release gate job name in ci.yml', () => {
    const workflow = readFileSync('.github/workflows/ci.yml', 'utf8');
    expect(workflow).toContain(`name: ${RELEASE_GATE_JOB_NAME}\n`);
  });
});
