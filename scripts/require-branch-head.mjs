import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function staleDeploymentFailure(checkedOutSha, branchHead) {
  if (
    typeof checkedOutSha === 'string'
    && typeof branchHead === 'string'
    && checkedOutSha.length > 0
    && checkedOutSha === branchHead
  ) {
    return null;
  }
  return `Refusing hosted mutation: branch head is ${branchHead || 'missing'}, this run is ${checkedOutSha || 'missing'}.`;
}

export function assertBranchName(refName) {
  if (
    typeof refName !== 'string'
    || refName.length === 0
    || refName.startsWith('-')
    || refName.includes('..')
    || !/^[A-Za-z0-9._/-]+$/.test(refName)
  ) {
    throw new Error('GITHUB_REF_NAME is not a branch name.');
  }
  return refName;
}

function readBranchHead(refName) {
  execFileSync('git', ['fetch', '--depth=1', 'origin', refName], { stdio: 'inherit' });
  return execFileSync('git', ['rev-parse', `origin/${refName}`], { encoding: 'utf8' }).trim();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const refName = assertBranchName(process.env.GITHUB_REF_NAME);
    const checkedOutSha = process.env.GITHUB_SHA ?? '';
    const branchHead = readBranchHead(refName);
    console.log(`checked-out=${checkedOutSha}`);
    console.log(`origin/${refName}=${branchHead}`);
    const failure = staleDeploymentFailure(checkedOutSha, branchHead);
    if (failure) {
      console.error(`::error::${failure}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`::error::${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}
