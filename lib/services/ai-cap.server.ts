import { ClientError } from 'graphql-request';

import { AI_DAILY_CAP_CODE, aiCapBody } from '@/lib/ai-cap';
import { getServerGraphqlSdk } from '@/lib/graphql/server-sdk';
import {
  ApiAuthError,
  type ApiUserContext,
  requireApiUser,
} from '@/lib/supabase/require-api-user';

/** Resolves the signed-in caller of an AI route, a 401, or a 500 when auth itself fails. */
export async function requireAiUser(request: Request): Promise<ApiUserContext | Response> {
  try {
    return await requireApiUser(request);
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return Response.json({ error: error.message }, { status: 401 });
    }
    console.error('AI route auth failed', error);
    return Response.json({ error: 'AI is not available right now. Try again in a moment.' }, { status: 500 });
  }
}

function graphqlMessages(error: unknown): string[] {
  if (error instanceof ClientError) {
    return (error.response.errors ?? []).map((item) => item.message ?? '');
  }
  return [];
}

/**
 * Spends one of the caller's daily AI requests through pg_graphql before the
 * provider is called. Returns null when the request may go ahead, a 429 at the
 * cap, or a 503 when the count cannot be checked: the cap fails closed.
 *
 * A request that reaches the provider stays counted even if the provider then
 * fails, because the provider may already have spent tokens on it.
 */
export async function spendAiRequest(context: ApiUserContext, now = new Date()): Promise<Response | null> {
  try {
    await getServerGraphqlSdk(context.accessToken).ConsumeAiRequest();
    return null;
  } catch (error) {
    const messages = graphqlMessages(error);
    if (messages.some((message) => message.includes(AI_DAILY_CAP_CODE))) {
      const body = aiCapBody(now);
      const retryAfter = Math.max(1, Math.ceil((Date.parse(body.resetAt) - now.getTime()) / 1000));
      return Response.json(body, { status: 429, headers: { 'Retry-After': String(retryAfter) } });
    }
    if (messages.some((message) => message.includes('not authenticated'))) {
      return Response.json({ error: 'Please sign in' }, { status: 401 });
    }
    console.error('consume_ai_request failed', error);
    return Response.json({ error: 'AI is not available right now. Try again in a moment.' }, { status: 503 });
  }
}
