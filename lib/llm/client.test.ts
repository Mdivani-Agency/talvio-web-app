import { describe, expect, it, vi } from 'vitest';

import { createLlmClient, jobRequest, LLM_ADAPTER_PATH } from './client';
import { LlmError, LlmNetworkError } from './errors';

const JOB_ID = '7d0c3c1e-1a2b-4c3d-8e4f-5a6b7c8d9e0f';
const accepted = { jobId: JOB_ID, status: 'queued', statusUrl: `/llm/v1/jobs/${JOB_ID}`, pollAfterMs: 1000, replayed: false };

describe('LLM client', () => {
  it('submits a job through the adapter with its key as the Idempotency-Key header', async () => {
    const fetcher = vi.fn(async () => Response.json(accepted, { status: 202 }));
    const client = createLlmClient(fetcher);
    const request = jobRequest(
      { operation: 'parse_document', locale: 'en-US', input: { kind: 'text', text: 'Ada', extraction: null } },
      'key-12345678',
    );
    await expect(client.createJob(request)).resolves.toMatchObject({ jobId: JOB_ID, replayed: false });
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${LLM_ADAPTER_PATH}/jobs`);
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Idempotency-Key': 'key-12345678' });
    expect(JSON.parse(String(init.body))).toEqual({ ...request, schemaVersion: '1.0', clientRequestId: 'key-12345678' });
  });

  it('tolerates fields it does not know', async () => {
    const client = createLlmClient(async () => Response.json({ ...accepted, newField: 1 }, { status: 202 }));
    await expect(client.retryJob(JOB_ID)).resolves.toMatchObject({ jobId: JOB_ID });
  });

  it('turns a request that got no answer into a network error', async () => {
    const client = createLlmClient(async () => {
      throw new TypeError('Failed to fetch');
    });
    await expect(client.getJob(JOB_ID)).rejects.toBeInstanceOf(LlmNetworkError);
  });

  it('asks a guest to sign in without sending anything', async () => {
    const client = createLlmClient(async () => {
      throw new Error('No token found');
    });
    await expect(client.getJob(JOB_ID)).rejects.toMatchObject({ code: 'unauthorized', message: 'Please sign in' });
  });

  it('rejects a body that is not a job', async () => {
    const client = createLlmClient(async () => Response.json({ hello: 'world' }));
    const error = await client.getJob(JOB_ID).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(LlmError);
    expect(error).toMatchObject({ code: 'invalid_response' });
  });
});
