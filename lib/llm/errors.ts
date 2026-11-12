import { errorBodySchema, RETRYABLE_JOB_ERRORS, type JobError } from './contract';

/*
 * Errors from the LLM service mapped to the states the UI already has (MDI-221):
 * `quota_exceeded` (429, Retry-After) replaces the old daily-cap error, `unauthorized` keeps
 * "Please sign in", `stale_context` asks for a regeneration. Service messages are safe to show:
 * they never contain content, tokens or provider payloads.
 */

export type LlmUiState = 'capped' | 'signIn' | 'stale' | 'offline' | 'expired' | 'error';

export const SIGN_IN_MESSAGE = 'Please sign in';
export const OFFLINE_MESSAGE = 'You are offline. AI picks up where it left off when you are back online.';
/** The service's message for a valid token whose account or plan has no AI. */
export const ACCOUNT_UNAVAILABLE_MESSAGE = 'AI features are not available for this account.';
export const UNAVAILABLE_MESSAGE ='AI is not available right now. Try again in a moment.';

export class LlmError extends Error {
  readonly code: string;
  readonly status: number | null;
  readonly retryable: boolean;
  readonly correlationId: string | null;
  /** When the caller may try again, from Retry-After. */
  readonly retryAt: Date | null;

  constructor(options: {
    code: string;
    message: string;
    status?: number | null;
    retryable?: boolean;
    correlationId?: string | null;
    retryAt?: Date | null;
  }) {
    super(options.message);
    this.name = 'LlmError';
    this.code = options.code;
    this.status = options.status ?? null;
    this.retryable = options.retryable ?? false;
    this.correlationId = options.correlationId ?? null;
    this.retryAt = options.retryAt ?? null;
  }

  get uiState(): LlmUiState {
    return uiStateFor(this.code);
  }
}

/** The request never got an answer: offline, timed out or cut off. Safe to repeat with the same key. */
export class LlmNetworkError extends LlmError {
  constructor(message = UNAVAILABLE_MESSAGE) {
    super({ code: 'network_error', message, retryable: true });
    this.name = 'LlmNetworkError';
  }
}

export function uiStateFor(code: string): LlmUiState {
  switch (code) {
    case 'quota_exceeded':
      return 'capped';
    case 'unauthorized':
      return 'signIn';
    case 'stale_context':
      return 'stale';
    case 'network_error':
      return 'offline';
    case 'not_found':
    case 'deadline_exceeded':
    case 'revoked':
      return 'expired';
    default:
      return 'error';
  }
}

/** Retry-After in seconds or as an HTTP date. */
export function parseRetryAfter(value: string | null, now = new Date()): Date | null {
  if (!value) {
    return null;
  }
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return new Date(now.getTime() + seconds * 1000);
  }
  const date = Date.parse(value);
  return Number.isNaN(date) ? null : new Date(date);
}

/** The error for a non-2xx answer from `/api/llm`. */
export async function errorFromResponse(response: Response, now = new Date()): Promise<LlmError> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }
  const parsed = errorBodySchema.safeParse(body);
  const retryAt = parseRetryAfter(response.headers.get('retry-after'), now);
  if (!parsed.success) {
    return new LlmError({
      code: response.status === 401 ? 'unauthorized' : 'dependency_unavailable',
      message: response.status === 401 ? SIGN_IN_MESSAGE : UNAVAILABLE_MESSAGE,
      status: response.status,
      retryable: response.status >= 500,
      retryAt,
    });
  }
  const { code, message, retryable, correlationId } = parsed.data.error;
  return new LlmError({
    code,
    // A refused token keeps the app's own sign-in prompt; a suspended account keeps the service's words.
    message: code === 'unauthorized' && message !== ACCOUNT_UNAVAILABLE_MESSAGE ? SIGN_IN_MESSAGE : message,
    status: response.status,
    retryable,
    correlationId,
    retryAt,
  });
}

/** The error for a job that ended without a result. */
export function errorFromJob(error: JobError): LlmError {
  return new LlmError({
    code: error.code,
    message: error.message,
    retryable: error.retryable && (RETRYABLE_JOB_ERRORS as readonly string[]).includes(error.code),
    correlationId: error.correlationId,
  });
}
