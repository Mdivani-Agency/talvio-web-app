import { AI_DAILY_CAP_CODE, aiCapBody } from '@/lib/ai-cap';
import {
  type ApiUserContext,
  requireApiUser,
  unauthorizedResponse,
} from '@/lib/supabase/require-api-user';

/** Resolves the signed-in caller of an AI route, or a 401 response. */
export async function requireAiUser(request: Request): Promise<ApiUserContext | Response> {
  try {
    return await requireApiUser(request);
  } catch (error) {
    return unauthorizedResponse(error) ?? Response.json({ error: 'Please sign in' }, { status: 401 });
  }
}

/**
 * Spends one of the caller's daily AI requests before the provider is called.
 * Returns null when the request may go ahead, a 429 at the cap, or a 503 when
 * the count cannot be checked: the cap fails closed.
 */
export async function spendAiRequest(context: ApiUserContext, now = new Date()): Promise<Response | null> {
  const { error } = await context.supabase.rpc('consume_ai_request');
  if (!error) {
    return null;
  }
  if (error.message?.includes(AI_DAILY_CAP_CODE)) {
    const body = aiCapBody(now);
    const retryAfter = Math.max(1, Math.ceil((Date.parse(body.resetAt) - now.getTime()) / 1000));
    return Response.json(body, { status: 429, headers: { 'Retry-After': String(retryAfter) } });
  }
  if (error.message?.includes('not authenticated')) {
    return Response.json({ error: 'Please sign in' }, { status: 401 });
  }
  console.error('consume_ai_request failed', error);
  return Response.json({ error: 'AI is not available right now. Try again in a moment.' }, { status: 503 });
}
