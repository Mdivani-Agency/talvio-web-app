import { pathToFileURL } from 'node:url';

export function releaseGateFailure(qualityResult, localE2eResult) {
  if (qualityResult === 'success' && localE2eResult === 'success') {
    return null;
  }
  return 'Release gate requires quality and local-e2e to succeed.';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const quality = process.env.QUALITY_RESULT ?? '';
  const localE2e = process.env.LOCAL_E2E_RESULT ?? '';
  console.log(`quality=${quality}`);
  console.log(`local-e2e=${localE2e}`);
  const failure = releaseGateFailure(quality, localE2e);
  if (failure) {
    console.error(`::error::${failure}`);
    process.exit(1);
  }
}
