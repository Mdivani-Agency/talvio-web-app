import { describe, expect, it } from 'vitest';

import {
  DASHBOARD_PDF_LOCK,
  EDITOR_PDF_LOCK,
  IMPROVE_LOCK,
  OFFLINE_TITLE,
  SAVE_PROFILE_LOCK,
  SLOW_AFTER_MS,
  STEP_STATUS,
  STILL_WORKING_TITLE,
  TAILOR_LOCK,
  elapsedText,
} from './page-lock-copy';

describe('page lock copy', () => {
  it('shows the time so far as m:ss', () => {
    expect(elapsedText(0)).toBe('0:00');
    expect(elapsedText(9)).toBe('0:09');
    expect(elapsedText(72)).toBe('1:12');
    expect(elapsedText(-3)).toBe('0:00');
    expect(elapsedText(4.9)).toBe('0:04');
  });

  it('says Still working after one minute and names the offline state', () => {
    expect(SLOW_AFTER_MS).toBe(60_000);
    expect(STILL_WORKING_TITLE).toBe('Still working.');
    expect(OFFLINE_TITLE).toBe('Waiting for a connection');
    expect(STEP_STATUS).toEqual({ done: ' (done)', active: ' (in progress)', paused: ' (paused)', todo: '' });
  });

  it('saves the profile in one line and builds a PDF from My resumes in two steps', () => {
    expect(SAVE_PROFILE_LOCK.title).toBe('Saving your profile');
    expect(SAVE_PROFILE_LOCK.line).toBe('Saving your details');
    expect(DASHBOARD_PDF_LOCK.steps).toEqual(['Building the PDF', 'Starting your download']);
    expect(DASHBOARD_PDF_LOCK.note).toMatch(/Keep this tab open/);
  });

  it('tells people waiting for questions they do not need to start again', () => {
    expect(IMPROVE_LOCK.slow).toMatch(/don’t need to start again/);
    expect(IMPROVE_LOCK.offline).toMatch(/paused, not lost/);
  });

  it('makes the editor PDF in three steps and says the changes are kept when it fails', () => {
    expect(EDITOR_PDF_LOCK.steps).toEqual(['Saving your changes', 'Building the PDF', 'Starting your download']);
    expect(EDITOR_PDF_LOCK.failure.title).toBe('Your PDF wasn’t made');
    expect(EDITOR_PDF_LOCK.failure.kept).toBe('Your changes are saved.');
    expect([EDITOR_PDF_LOCK.failure.retry, EDITOR_PDF_LOCK.failure.back]).toEqual(['Try again', 'Back to the editor']);
  });

  it('tailors in three steps with Stop tailoring', () => {
    expect(TAILOR_LOCK.steps).toEqual(['Reading the job post', 'Comparing it with your resume', 'Writing suggested changes']);
    expect(TAILOR_LOCK.stop).toBe('Stop tailoring');
  });
});
