import { authedFetch } from '@/lib/supabase/authed-fetch';

import {
  jobAcceptedSchema,
  jobSchema,
  LLM_SCHEMA_VERSION,
  type CreateJobRequest,
  type Job,
  type JobAccepted,
  type JobRequestBody,
} from './contract';
import { errorFromResponse, LlmError, LlmNetworkError, SIGN_IN_MESSAGE, UNAVAILABLE_MESSAGE } from './errors';

/*
 * Browser client for the LLM service through the same-origin adapter (`app/api/llm`), which adds
 * nothing but the forwarded access token. Every call is bounded by a timeout; a call that gets no
 * answer throws LlmNetworkError, and a job submission is then repeated with the same key.
 */

export const LLM_ADAPTER_PATH = '/api/llm/v1';
export const LLM_REQUEST_TIMEOUT_MS = 20_000;

type Schema<T> = { safeParse: (value: unknown) => { success: true; data: T } | { success: false } };

export type LlmFetch = (url: string, init: RequestInit) => Promise<Response>;

async function send(fetcher: LlmFetch, path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetcher(`${LLM_ADAPTER_PATH}${path}`, {
      ...init,
      cache: 'no-store',
      signal: init.signal ?? AbortSignal.timeout(LLM_REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    // authedFetch throws before the request when the browser has no session.
    if (error instanceof Error && error.message === 'No token found') {
      throw new LlmError({ code: 'unauthorized', message: SIGN_IN_MESSAGE, status: 401 });
    }
    throw new LlmNetworkError();
  }
}

async function read<T>(response: Response, schema: Schema<T>): Promise<T> {
  if (!response.ok) {
    throw await errorFromResponse(response);
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new LlmNetworkError();
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new LlmError({ code: 'invalid_response', message: UNAVAILABLE_MESSAGE, status: response.status });
  }
  return parsed.data;
}

export function createLlmClient(fetcher: LlmFetch = authedFetch) {
  return {
    /** POST /jobs. The Idempotency-Key header equals clientRequestId, so a repeat returns the same job. */
    async createJob(request: CreateJobRequest): Promise<JobAccepted> {
      const response = await send(fetcher, '/jobs', {
        method: 'POST',
        headers: { 'Idempotency-Key': request.clientRequestId },
        body: JSON.stringify(request),
      });
      return read(response, jobAcceptedSchema);
    },

    async getJob(jobId: string): Promise<Job> {
      const response = await send(fetcher, `/jobs/${encodeURIComponent(jobId)}`, { method: 'GET' });
      return read(response, jobSchema);
    },

    async cancelJob(jobId: string): Promise<Job> {
      const response = await send(fetcher, `/jobs/${encodeURIComponent(jobId)}/cancel`, { method: 'POST' });
      return read(response, jobSchema);
    },

    async retryJob(jobId: string): Promise<JobAccepted> {
      const response = await send(fetcher, `/jobs/${encodeURIComponent(jobId)}/retry`, { method: 'POST' });
      return read(response, jobAcceptedSchema);
    },
  };
}

export type LlmClient = ReturnType<typeof createLlmClient>;

export function jobRequest(body: JobRequestBody, clientRequestId: string): CreateJobRequest {
  return { ...body, schemaVersion: LLM_SCHEMA_VERSION, clientRequestId } as CreateJobRequest;
}
