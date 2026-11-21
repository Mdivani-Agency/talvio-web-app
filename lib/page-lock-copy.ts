/**
 * Copy for the page lock (MDI-670, epic MDI-668): the card that covers the page while work that changes data or runs
 * AI is in progress. From the "Talvio UI Refresh" canvas, page Loading states (LD-*).
 */

export const ELAPSED_LABEL = 'Time so far';
export const STILL_WORKING_TITLE = 'Still working.';
export const OFFLINE_TITLE = 'Waiting for a connection';

/** Read after each step's label by screen readers; the icons carry the same state visually. */
export const STEP_STATUS = {
  done: ' (done)',
  active: ' (in progress)',
  paused: ' (paused)',
  todo: '',
} as const;

/** After this long the card adds "Still working." with the flow's slow note. */
export const SLOW_AFTER_MS = 60_000;

/** Elapsed time as m:ss, as on the card. */
export function elapsedText(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

/** Save profile (LD-save): one line, no steps, no cancel. */
export const SAVE_PROFILE_LOCK = {
  context: 'Save profile',
  title: 'Saving your profile',
  line: 'Saving your details',
  note: 'Keep this tab open until it finishes.',
  slow: 'Saving is taking longer than usual. Keep this tab open.',
} as const;

/** Generate PDF on a My resumes card (LD-dash-pdf). */
export const DASHBOARD_PDF_LOCK = {
  context: 'Generate PDF',
  title: 'Making your PDF',
  steps: ['Building the PDF', 'Starting your download'],
  note: 'Keep this tab open until your download starts. Your resumes unlock when it does.',
  slow: 'Building the PDF is taking longer than usual. Keep this tab open.',
} as const;

/** AI questions (LD-questions): the slow and offline notes; the rest is in `profile-improve-copy.ts`. */
export const IMPROVE_LOCK = {
  slow: 'Longer profiles take more time. You don’t need to start again.',
  offline: 'Your questions are paused, not lost. They carry on by themselves when you are back online.',
} as const;

/** Generate PDF in the editor (LD-pdf, LD-pdf-failed): the dialog hands over to the lock. */
export const EDITOR_PDF_LOCK = {
  context: 'Download PDF',
  title: 'Making your PDF',
  steps: ['Saving your changes', 'Building the PDF', 'Starting your download'],
  note: 'Keep this tab open until your download starts. The editor unlocks when it does.',
  slow: 'Building the PDF is taking longer than usual. Keep this tab open.',
  failure: {
    title: 'Your PDF wasn’t made',
    /** After the changes were saved: the PDF service failed. */
    body: 'The PDF service did not answer. Try again in a moment.',
    kept: 'Your changes are saved.',
    /** Before the changes were saved, so nothing was built and the changes may not be in your account yet. */
    unsavedBody: 'Your changes could not be saved, so the PDF was not started. Check your connection and try again.',
    retry: 'Try again',
    back: 'Back to the editor',
  },
} as const;

/** Tailor to a job (LD-tailor). */
export const TAILOR_LOCK = {
  context: 'Tailor to a job',
  title: 'Tailoring your resume',
  steps: ['Reading the job post', 'Comparing it with your resume', 'Writing suggested changes'],
  note: 'You review every change before anything is saved. Your profile and saved resumes stay as they are.',
  slow: 'Longer job posts take more time. You don’t need to start again.',
  offline: 'Tailoring is paused, not lost. It carries on by itself when you are back online.',
  stop: 'Stop tailoring',
} as const;
