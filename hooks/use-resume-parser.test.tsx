import { act, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import fixture from '../test/fixtures/llm/parse-result-partial-profile.json';
import { renderHook } from '../test/utils/render';

const JOB_ID = '8e9f0a1b-2c3d-4e4f-9a6b-7c8d9e0f1a28';

const { authedFetch, parseResume, extractPdfPages } = vi.hoisted(() => ({ authedFetch: vi.fn(), parseResume: vi.fn(), extractPdfPages: vi.fn() }));
vi.mock('@/lib/supabase/authed-fetch', () => ({ authedFetch }));
vi.mock('@lib/clients/llm.client', () => ({ parseResume }));
vi.mock('@lib/providers', () => ({
  useUserSession: () => ({ session: { user: { id: 'user-1' } }, isPending: false }),
}));
vi.mock('./use-pdf-text', () => ({
  usePdfText: () => ({ parsePdf: vi.fn(), extractPdfPages, parsing: false }),
}));

import { importJobStorageKey, useResumeParser } from './use-resume-parser';

const succeeded = {
  jobId: JOB_ID,
  operation: 'parse_document',
  status: 'succeeded',
  stage: 'done',
  sessionId: null,
  contextRevisionId: null,
  parentJobId: null,
  createdAt: '2026-11-12T10:00:00.000Z',
  updatedAt: '2026-11-12T10:00:05.000Z',
  deadlineAt: '2026-11-12T10:10:00.000Z',
  pollAfterMs: null,
  result: fixture.payload,
  error: null,
};

function respondWith(...bodies: [number, unknown][]) {
  for (const [status, body] of bodies) {
    authedFetch.mockResolvedValueOnce(Response.json(body, { status }));
  }
}

function setup() {
  const events = { onResumeParsed: vi.fn(), onError: vi.fn() };
  const view = renderHook(() => useResumeParser(events, { surface: 'onboarding' }));
  return { ...view, events };
}

beforeEach(() => {
  authedFetch.mockReset();
  parseResume.mockReset();
  extractPdfPages.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  window.localStorage.clear();
});

describe('useResumeParser', () => {
  it('runs parse_document on the LLM service when the flag is on', async () => {
    vi.stubEnv('NEXT_PUBLIC_FLAG_LLM_SERVICE', 'true');
    respondWith([202, { jobId: JOB_ID, status: 'queued', pollAfterMs: 500, replayed: false }], [200, succeeded]);
    const { result, events } = setup();

    await act(async () => {
      await result.current.parsePastedText('Nino Beridze, Senior Backend Engineer');
    });
    await waitFor(() => expect(events.onResumeParsed).toHaveBeenCalledTimes(1), { timeout: 3000 });

    const [account, sourceText, review] = events.onResumeParsed.mock.calls[0]!;
    expect(account.profile.firstName).toBe('Nino');
    expect(sourceText).toBe('Nino Beridze, Senior Backend Engineer');
    expect(review).toMatchObject({ partial: true });
    expect(parseResume).not.toHaveBeenCalled();

    const [url, init] = authedFetch.mock.calls[0]!;
    expect(url).toBe('/api/llm/v1/jobs');
    expect(JSON.parse(init.body)).toMatchObject({
      operation: 'parse_document',
      input: { kind: 'text', text: 'Nino Beridze, Senior Backend Engineer', extraction: null },
    });
    // Delivered once, then forgotten: a reload does not offer it again.
    expect(window.localStorage.getItem(importJobStorageKey('user-1', 'onboarding'))).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('refuses empty text without calling the service', async () => {
    vi.stubEnv('NEXT_PUBLIC_FLAG_LLM_SERVICE', 'true');
    const { result, events } = setup();
    await act(async () => {
      await result.current.parsePastedText('   ');
    });
    expect(events.onError).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/could not find any text/) }));
    expect(authedFetch).not.toHaveBeenCalled();
  });

  it('shows the service error, such as the daily limit', async () => {
    vi.stubEnv('NEXT_PUBLIC_FLAG_LLM_SERVICE', 'true');
    respondWith([429, { error: { code: 'quota_exceeded', message: 'You have used today’s AI jobs.', retryable: false, correlationId: 'c' } }]);
    const { result, events } = setup();
    await act(async () => {
      await result.current.parsePastedText('Some resume');
    });
    await waitFor(() => expect(events.onError).toHaveBeenCalled());
    expect(events.onError.mock.calls[0]![0]).toMatchObject({ code: 'quota_exceeded', message: 'You have used today’s AI jobs.' });
  });

  it('is busy while a PDF is read, and a newer paste wins over it', async () => {
    vi.stubEnv('NEXT_PUBLIC_FLAG_LLM_SERVICE', 'true');
    let finishRead: (value: unknown) => void = () => undefined;
    extractPdfPages.mockReturnValueOnce(new Promise((resolve) => { finishRead = resolve; }));
    respondWith([202, { jobId: JOB_ID, status: 'queued', pollAfterMs: 500, replayed: false }], [200, succeeded]);
    const { result, events } = setup();
    const file = new File(['%PDF'], 'resume.pdf', { type: 'application/pdf' });

    let reading: Promise<unknown> = Promise.resolve();
    act(() => {
      reading = result.current.parseResumeText(file) as Promise<unknown>;
    });
    await waitFor(() => expect(result.current.loading).toBe(true));

    await act(async () => {
      await result.current.parsePastedText('Nino Beridze, Senior Backend Engineer');
    });
    await act(async () => {
      finishRead({ pages: [{ pageNumber: 1, text: 'Older PDF text' }], version: '1' });
      await reading;
    });
    await waitFor(() => expect(events.onResumeParsed).toHaveBeenCalledTimes(1), { timeout: 3000 });
    expect(authedFetch).toHaveBeenCalledTimes(2);
    expect(JSON.parse(authedFetch.mock.calls[0]![1].body).input.text).toBe('Nino Beridze, Senior Backend Engineer');
  });

  it('keeps the legacy route while the flag is off', async () => {
    parseResume.mockResolvedValue({
      profile: { firstName: 'Ada', lastName: 'Owner', email: null, role: null, tagline: null, phone: null, website: null, city: null, country: null, seniority: null },
      experience: null,
      education: null,
      recommendations: null,
      projects: null,
      skills: null,
      tools: null,
      links: null,
      languages: null,
    });
    const { result, events } = setup();
    await act(async () => {
      await result.current.parsePastedText('Ada Owner');
    });
    expect(parseResume).toHaveBeenCalledWith('Ada Owner');
    expect(events.onResumeParsed).toHaveBeenCalledWith(expect.objectContaining({ profile: expect.objectContaining({ firstName: 'Ada' }) }), 'Ada Owner', null);
    expect(authedFetch).not.toHaveBeenCalled();
  });
});
