import { describe, expect, it } from 'vitest';

import {
  DASHBOARD_PDF_LOCK,
  IMPROVE_LOCK,
  OFFLINE_TITLE,
  SAVE_PROFILE_LOCK,
  SLOW_AFTER_MS,
  STEP_STATUS,
  STILL_WORKING_TITLE,
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
});
