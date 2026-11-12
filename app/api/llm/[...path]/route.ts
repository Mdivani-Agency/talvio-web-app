import { featureFlags } from '@/lib/flags';
import { llmErrorResponse, proxyLlmRequest } from '@/lib/services/llm-proxy.server';

/*
 * Same-origin adapter for the LLM service (`/api/llm/v1/...` → `${LLM_SERVICE_URL}/v1/...`).
 * See lib/services/llm-proxy.server.ts. Off until NEXT_PUBLIC_FLAG_LLM_SERVICE is on.
 */

export const dynamic = 'force-dynamic';

async function handle(request: Request, ctx: RouteContext<'/api/llm/[...path]'>) {
  if (!featureFlags().llmService) {
    return llmErrorResponse(404, 'not_found', 'Not found.');
  }
  const { path } = await ctx.params;
  return proxyLlmRequest(request, path);
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
