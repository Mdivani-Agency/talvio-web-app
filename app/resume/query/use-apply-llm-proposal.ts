import { decodeGraphqlJson } from '@/lib/adapters/resume.adapter';
import { getGraphqlSdk, graphqlErrorText, parseGraphqlError } from '@/lib/graphql-client';
import { applyErrorMessage, applyReceiptSchema, type ApplyReceipt, type ApplyRequest } from '@lib/llm/apply';

/**
 * Saves an accepted LLM proposal through `apply_llm_proposal` (MDI-222) and returns its receipt.
 * A repeated call for the same proposal returns the first receipt with `replayed: true`.
 */
export async function applyLlmProposal(request: ApplyRequest): Promise<ApplyReceipt> {
  const sdk = await getGraphqlSdk();
  let raw: string | null | undefined;
  try {
    const data = await sdk.Apply_Llm_Proposal({ p_request: JSON.stringify(request) });
    raw = data.apply_llm_proposal;
  } catch (error) {
    throw new Error(applyErrorMessage(graphqlErrorText(error)) ?? parseGraphqlError(error));
  }
  const receipt = applyReceiptSchema.safeParse(decodeGraphqlJson(raw));
  if (!receipt.success) {
    throw new Error('The changes could not be saved. Try again.');
  }
  return receipt.data;
}
