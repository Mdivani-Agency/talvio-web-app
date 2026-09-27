import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { assertBranchName, staleDeploymentFailure } from '../scripts/require-branch-head.mjs';

const SHA = 'a'.repeat(40);
const OTHER = 'b'.repeat(40);

describe('stale deployment guard', () => {
  it('allows a run that matches the branch head', () => {
    expect(staleDeploymentFailure(SHA, SHA)).toBeNull();
  });

  it('refuses a missing, empty, or different head', () => {
    const message = `Refusing hosted mutation: branch head is ${OTHER}, this run is ${SHA}.`;
    expect(staleDeploymentFailure(SHA, OTHER)).toBe(message);
    expect(staleDeploymentFailure('', SHA)).toBe(
      `Refusing hosted mutation: branch head is ${SHA}, this run is missing.`,
    );
    expect(staleDeploymentFailure(SHA, '')).toBe(
      `Refusing hosted mutation: branch head is missing, this run is ${SHA}.`,
    );
  });

  it('accepts a normal branch name and rejects a revision or flag', () => {
    expect(assertBranchName('development')).toBe('development');
    expect(assertBranchName('cursor/mdi-247-deploy-gate-6bac')).toBe(
      'cursor/mdi-247-deploy-gate-6bac',
    );
    expect(() => assertBranchName('origin/development')).not.toThrow();
    expect(() => assertBranchName('--upload-pack=evil')).toThrow(/branch name/);
    expect(() => assertBranchName('development..main')).toThrow(/branch name/);
    expect(() => assertBranchName('')).toThrow(/branch name/);
  });

  it('disables every Git deployment and pins the Vercel CLI', () => {
    const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
      git: { deploymentEnabled: boolean };
    };
    const workflow = readFileSync('.github/workflows/ci.yml', 'utf8');
    expect(vercel.git.deploymentEnabled).toBe(false);
    expect(workflow).toContain('npm install --global vercel@60.1.3');
    expect(workflow).not.toContain('vercel@latest');
    expect(workflow.match(/node scripts\/require-branch-head\.mjs/g)).toHaveLength(2);
  });
});
