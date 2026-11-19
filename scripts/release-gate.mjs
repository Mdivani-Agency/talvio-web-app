import { pathToFileURL } from 'node:url';

/** The CI jobs that must all succeed, keyed by job id, with the variable that carries each result. */
export const RELEASE_GATE_JOBS = {
  quality: 'QUALITY_RESULT',
  'db-tests': 'DB_TESTS_RESULT',
  'local-e2e': 'LOCAL_E2E_RESULT',
};

/** A skipped, cancelled or missing result fails the gate as surely as a failed one. */
export function releaseGateFailure(results) {
  const failed = Object.keys(RELEASE_GATE_JOBS).filter((job) => results[job] !== 'success');
  if (failed.length === 0) {
    return null;
  }
  return `Release gate requires ${Object.keys(RELEASE_GATE_JOBS).join(', ')} to succeed. Not successful: ${failed.join(', ')}.`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const results = Object.fromEntries(
    Object.entries(RELEASE_GATE_JOBS).map(([job, variable]) => [job, process.env[variable] ?? '']),
  );
  for (const [job, result] of Object.entries(results)) {
    console.log(`${job}=${result}`);
  }
  const failure = releaseGateFailure(results);
  if (failure) {
    console.error(`::error::${failure}`);
    process.exit(1);
  }
}
