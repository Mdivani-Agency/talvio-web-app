import { formatRenewalDate } from '@/lib/allowance-copy';

/**
 * Per-user daily cap on the AI routes (MDI-401). Display-only mirror of
 * `ai_daily_request_cap()`; the server enforces it in `consume_ai_request`.
 * Separate from the monthly PDF allowance: AI requests never touch credits.
 */
export const AI_DAILY_REQUEST_CAP = 20;

/** Error code in a 429 body and in the RPC exception. */
export const AI_DAILY_CAP_CODE = 'ai_daily_cap';

export const AI_CAP_TITLE = 'Daily AI limit reached';

/** The next 00:00 UTC, when the daily count starts again. */
export function nextAiCapReset(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
}

/** Shown in the 429 body, toasts and the questions step. */
export function aiCapReachedLine(resetAt: Date, cap = AI_DAILY_REQUEST_CAP): string {
  return `You have used today's ${cap} AI requests. AI is back at 00:00 UTC on ${formatRenewalDate(resetAt)}. You can keep editing and generating PDFs.`;
}

export type AiCapBody = {
  error: string;
  code: typeof AI_DAILY_CAP_CODE;
  resetAt: string;
};

export function aiCapBody(now = new Date()): AiCapBody {
  const resetAt = nextAiCapReset(now);
  return { error: aiCapReachedLine(resetAt), code: AI_DAILY_CAP_CODE, resetAt: resetAt.toISOString() };
}

/** Thrown by the AI client when a route answers 429 at the daily cap. */
export class AiCapError extends Error {
  resetAt: Date;

  constructor(message: string, resetAt: Date) {
    super(message);
    this.name = 'AiCapError';
    this.resetAt = resetAt;
  }
}

export function isAiCapBody(body: unknown): body is AiCapBody {
  if (!body || typeof body !== 'object') {
    return false;
  }
  const value = body as Partial<AiCapBody>;
  return value.code === AI_DAILY_CAP_CODE && typeof value.error === 'string' && typeof value.resetAt === 'string';
}
