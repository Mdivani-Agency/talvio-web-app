import { pathToFileURL } from 'node:url';

import { assertBranchName } from './require-branch-head.mjs';

export const CI_WORKFLOW_FILE = 'ci.yml';
export const RELEASE_GATE_JOB_NAME = 'Release gate';

// A CI push run that is not completed may still queue its db push. A manual
// dispatch queued after it would replace that pending job and skip its deploy.
export function inFlightRunFailure(runs) {
  const busy = runs.find((run) => run.status !== 'completed');
  if (!busy) {
    return null;
  }
  return `Refusing manual migration: CI run ${busy.id} on this branch is ${busy.status}. Let it finish, then retry.`;
}

export function releaseGateJobFailure(sha, run, jobs) {
  if (!run) {
    return `Refusing manual migration: no CI push run found for ${sha || 'missing'}.`;
  }
  const gate = jobs.find((job) => job.name === RELEASE_GATE_JOB_NAME);
  if (gate?.conclusion === 'success') {
    return null;
  }
  return `Refusing manual migration: CI run ${run.id} release gate is ${gate?.conclusion ?? 'missing'}, not success.`;
}

async function github(path, token) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'x-github-api-version': '2022-11-28',
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub API ${path} returned ${response.status}.`);
  }
  return response.json();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const refName = assertBranchName(process.env.GITHUB_REF_NAME);
    const sha = process.env.GITHUB_SHA ?? '';
    const repository = process.env.GITHUB_REPOSITORY ?? '';
    const token = process.env.GITHUB_TOKEN ?? '';
    if (!repository || !token) {
      throw new Error('GITHUB_REPOSITORY and GITHUB_TOKEN are required.');
    }

    const query = new URLSearchParams({ branch: refName, event: 'push', per_page: '20' });
    const { workflow_runs: runs } = await github(
      `/repos/${repository}/actions/workflows/${CI_WORKFLOW_FILE}/runs?${query}`,
      token,
    );
    const failure = inFlightRunFailure(runs);
    if (failure) {
      throw new Error(failure);
    }

    const run = runs.find((candidate) => candidate.head_sha === sha);
    const jobs = run
      ? (await github(`/repos/${repository}/actions/runs/${run.id}/jobs?per_page=100`, token)).jobs
      : [];
    console.log(`commit=${sha}`);
    console.log(`ci-run=${run?.id ?? 'missing'}`);
    const gateFailure = releaseGateJobFailure(sha, run, jobs);
    if (gateFailure) {
      throw new Error(gateFailure);
    }
  } catch (error) {
    console.error(`::error::${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}
