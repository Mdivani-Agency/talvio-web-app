import { describe, expect, it } from 'vitest';

import { BRIEF_BANNED_TERMS } from '@/test/utils/public-copy';

import {
  AI_DAILY_CAP_CODE,
  AI_DAILY_REQUEST_CAP,
  aiCapBody,
  aiCapReachedLine,
  isAiCapBody,
  nextAiCapReset,
} from './ai-cap';

describe('nextAiCapReset', () => {
  it('returns the next 00:00 UTC', () => {
    expect(nextAiCapReset(new Date('2026-10-06T00:00:00Z')).toISOString()).toBe('2026-10-07T00:00:00.000Z');
    expect(nextAiCapReset(new Date('2026-10-06T23:59:59.999Z')).toISOString()).toBe('2026-10-07T00:00:00.000Z');
  });

  it('rolls over months and years', () => {
    expect(nextAiCapReset(new Date('2026-10-31T12:00:00Z')).toISOString()).toBe('2026-11-01T00:00:00.000Z');
    expect(nextAiCapReset(new Date('2026-12-31T23:00:00Z')).toISOString()).toBe('2027-01-01T00:00:00.000Z');
  });

  it('uses the UTC day, not the local one', () => {
    // 23:30 on 6 October in Los Angeles is already 7 October in UTC.
    expect(nextAiCapReset(new Date('2026-10-06T23:30:00-07:00')).toISOString()).toBe('2026-10-08T00:00:00.000Z');
  });
});

describe('aiCapReachedLine', () => {
  it('names the cap, the UTC reset and what still works', () => {
    expect(aiCapReachedLine(new Date('2026-10-07T00:00:00Z'))).toBe(
      "You have used today's 20 AI requests. AI is back at 00:00 UTC on 7 October. You can keep editing and generating PDFs.",
    );
  });

  it('follows the brief vocabulary', () => {
    expect(aiCapReachedLine(new Date('2026-10-07T00:00:00Z'))).not.toMatch(BRIEF_BANNED_TERMS);
  });
});

describe('aiCapBody', () => {
  it('carries the message, the code and the reset time', () => {
    const body = aiCapBody(new Date('2026-10-06T15:00:00Z'));
    expect(body).toEqual({
      error: aiCapReachedLine(new Date('2026-10-07T00:00:00Z')),
      code: AI_DAILY_CAP_CODE,
      resetAt: '2026-10-07T00:00:00.000Z',
    });
    expect(isAiCapBody(body)).toBe(true);
  });

  it('rejects other error bodies', () => {
    expect(isAiCapBody({ error: 'Failed to parse resume.' })).toBe(false);
    expect(isAiCapBody({ error: 'x', code: 'other', resetAt: '2026-10-07T00:00:00.000Z' })).toBe(false);
    expect(isAiCapBody(null)).toBe(false);
    expect(isAiCapBody('ai_daily_cap')).toBe(false);
  });

  it('mirrors the database cap of 20', () => {
    expect(AI_DAILY_REQUEST_CAP).toBe(20);
  });
});
