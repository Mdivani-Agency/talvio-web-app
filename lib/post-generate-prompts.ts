/**
 * What shows after a new resume PDF (MDI-658). Two prompts can be due for the same generation: the "Add to tracker"
 * bar (MDI-658) and the Trustpilot review prompt (MDI-652). They never show together: the bar wins, and the review
 * prompt is not recorded as shown, so it waits for the next generation. This file is the one place for that rule and
 * for the bar's device-local memory.
 */

export type PostGeneratePrompt = 'tracker' | 'feedback' | null;

/** The bar wins when both are due; the review prompt is checked only when the bar is not due. */
export function choosePostGeneratePrompt({ trackerDue, feedbackDue }: { trackerDue: boolean; feedbackDue: boolean }): PostGeneratePrompt {
  if (trackerDue) {
    return 'tracker';
  }
  return feedbackDue ? 'feedback' : null;
}

/** The resume ids a card would count for: the resume itself and, for a draft family, its generated original. */
export function trackerResumeIds(resume: { id: string; sourceResumeId?: string | null }): string[] {
  return resume.sourceResumeId ? [resume.id, resume.sourceResumeId] : [resume.id];
}

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem'>;

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function readJson<T>(key: string, fallback: T, store: Storage | null): T {
  try {
    const raw = store?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown, store: Storage | null) {
  try {
    store?.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the bar may ask again, which is harmless.
  }
}

const DISMISSED_PREFIX = 'talvio-tracker-prompt:v1:';
const DISMISSED_MAX = 200;

/** True when the bar was dismissed on this device for this resume or its family. */
export function trackerPromptDismissed(userId: string, resumeIds: string[], store = storage()): boolean {
  const dismissed = readJson<string[]>(`${DISMISSED_PREFIX}${userId}`, [], store);
  return resumeIds.some((id) => dismissed.includes(id));
}

/** Remembers a dismissal per resume on this device, so the same resume does not ask twice. */
export function dismissTrackerPrompt(userId: string, resumeId: string, store = storage()) {
  const key = `${DISMISSED_PREFIX}${userId}`;
  const dismissed = readJson<string[]>(key, [], store).filter((id) => id !== resumeId);
  writeJson(key, [...dismissed, resumeId].slice(-DISMISSED_MAX), store);
}

/** What "Tailor to a job" knew about the job, kept with the tailored resume on this device. No schema change. */
export type TailoredJob = { position: string; company: string; url: string };

const TAILORED_PREFIX = 'talvio-tailored-job:v1:';

export function rememberTailoredJob(userId: string, resumeId: string, job: Partial<TailoredJob>, store = storage()) {
  const key = `${TAILORED_PREFIX}${userId}`;
  const jobs = readJson<Record<string, TailoredJob>>(key, {}, store);
  jobs[resumeId] = { position: job.position?.trim() ?? '', company: job.company?.trim() ?? '', url: job.url?.trim() ?? '' };
  writeJson(key, jobs, store);
}

/** The tailored job for a resume or its family, if this device made it. */
export function tailoredJobFor(userId: string, resumeIds: string[], store = storage()): TailoredJob | null {
  const jobs = readJson<Record<string, TailoredJob>>(`${TAILORED_PREFIX}${userId}`, {}, store);
  for (const id of resumeIds) {
    if (jobs[id]) {
      return jobs[id];
    }
  }
  return null;
}
