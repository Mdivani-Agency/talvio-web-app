export const ACCOUNT_SNAPSHOT_KEY = 'account-state-snapshot';

export function accountSnapshotStorageKey(userId: string) {
  return `${ACCOUNT_SNAPSHOT_KEY}-${userId}`;
}
