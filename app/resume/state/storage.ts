export const RESUME_SNAPSHOT_KEY = 'resume-state-snapshot';

export function resumeSnapshotStorageKey(resumeId: string) {
  return `${RESUME_SNAPSHOT_KEY}-${resumeId}`;
}
