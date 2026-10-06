import { beforeEach, describe, expect, it, vi } from 'vitest';

const { authedFetch } = vi.hoisted(() => ({ authedFetch: vi.fn() }));

vi.mock('@/lib/supabase/authed-fetch', () => ({ authedFetch }));

import { AiCapError, aiCapBody } from '@/lib/ai-cap';

import { aiRequestError, fetchQuestions, parseResume } from './llm.client';

describe('aiRequestError', () => {
  it('turns a 429 cap body into an AiCapError with the reset time', async () => {
    const body = aiCapBody(new Date('2026-10-06T15:00:00Z'));
    const error = await aiRequestError(Response.json(body, { status: 429 }), 'Failed to parse resume');

    expect(error).toBeInstanceOf(AiCapError);
    expect(error.message).toBe(body.error);
    expect((error as AiCapError).resetAt.toISOString()).toBe('2026-10-07T00:00:00.000Z');
  });

  it('asks a signed-out user to sign in', async () => {
    const error = await aiRequestError(Response.json({ error: 'Please sign in' }, { status: 401 }), 'Failed');
    expect(error.message).toBe('Please sign in');
  });

  it('keeps the fallback for other failures, including bodies that are not JSON', async () => {
    expect((await aiRequestError(Response.json({ error: 'raw' }, { status: 500 }), 'Failed to parse resume')).message)
      .toBe('Failed to parse resume');
    expect((await aiRequestError(new Response('<html>', { status: 502 }), 'Failed')).message).toBe('Failed');
  });
});

describe('AI requests', () => {
  beforeEach(() => {
    authedFetch.mockReset();
  });

  it('send the session token through authedFetch', async () => {
    authedFetch.mockResolvedValue(Response.json({ questions: [] }));

    await fetchQuestions('resume text');

    expect(authedFetch).toHaveBeenCalledWith('/api/resume/qa', {
      method: 'POST',
      body: JSON.stringify({ resume: 'resume text' }),
    });
  });

  it('surface the daily cap message from parse', async () => {
    const body = aiCapBody(new Date('2026-10-06T15:00:00Z'));
    authedFetch.mockResolvedValue(Response.json(body, { status: 429 }));

    await expect(parseResume('resume text')).rejects.toThrow(body.error);
  });
});
