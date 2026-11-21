import { useMutation, useQueryClient } from '@tanstack/react-query';

import { decodeGraphqlJson } from '@/lib/adapters/resume.adapter';
import { getGraphqlSdk, graphqlErrorText, parseGraphqlError } from '@/lib/graphql-client';
import { applyErrorMessage, profileApplyReceiptSchema, type ProfileApplyReceipt } from '@lib/llm/apply';
import type { profileApplyRequest } from '@lib/llm/profile-proposal';

import { profileImprovementKey } from './use-profile-improvement';

export type ProfileApplyRequest = ReturnType<typeof profileApplyRequest>;

/**
 * Saves the accepted profile changes and their receipt through `apply_llm_proposal`
 * (`improve_profile`, MDI-644). A repeated call for the same proposal returns the first receipt.
 */
export async function applyProfileProposal(request: ProfileApplyRequest): Promise<ProfileApplyReceipt> {
  const sdk = await getGraphqlSdk();
  let raw: string | null | undefined;
  try {
    const data = await sdk.Apply_Llm_Proposal({ p_request: JSON.stringify(request) });
    raw = data.apply_llm_proposal;
  } catch (error) {
    throw new Error(applyErrorMessage(graphqlErrorText(error)) ?? parseGraphqlError(error));
  }
  const receipt = profileApplyReceiptSchema.safeParse(decodeGraphqlJson(raw));
  if (!receipt.success) {
    throw new Error('The changes could not be saved. Try again.');
  }
  return receipt.data;
}

export function useApplyProfileProposal(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: ProfileApplyRequest) => {
      const receipt = await applyProfileProposal(request);
      // submitWrapper needs an id.
      return { id: receipt.receiptId, receipt };
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['account', userId] }),
        queryClient.invalidateQueries({ queryKey: ['profile', userId] }),
        queryClient.invalidateQueries({ queryKey: profileImprovementKey(userId) }),
      ]);
    },
  });
}
