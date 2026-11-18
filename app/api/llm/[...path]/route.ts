import { proxyLlmRequest } from '@/lib/services/llm-proxy.server';

/*
 * Same-origin adapter for the LLM service (`/api/llm/v1/...` → `${LLM_SERVICE_URL}/v1/...`).
 * See lib/services/llm-proxy.server.ts.
 */

export const dynamic = 'force-dynamic';

async function handle(request: Request, ctx: RouteContext<'/api/llm/[...path]'>) {
  const { path } = await ctx.params;
  return proxyLlmRequest(request, path);
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
