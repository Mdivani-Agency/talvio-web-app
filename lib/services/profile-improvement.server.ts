import 'server-only';

import { getServerGraphqlSdk } from '@/lib/graphql/server-sdk';
import { unwrapCollection } from '@/lib/query/collection';

/*
 * The web's once-per-account flag for the free profile improvement (MDI-643, table
 * profile_ai_improvements). The /api/llm adapter claims it before it forwards an improve_profile
 * job, confirms it once the LLM service admitted the job, and releases it when the service refused
 * the request. Every call runs as the user, with their own access token: the RPCs act only on
 * auth.uid()'s row and none of them can clear a used flag.
 */

export type ClaimResult = 'claimed' | 'replay' | 'used' | 'busy';

export type ProfileImprovementFlag = {
  claim(accessToken: string, clientRequestId: string): Promise<ClaimResult>;
  confirm(accessToken: string, clientRequestId: string, jobId: string): Promise<void>;
  release(accessToken: string, clientRequestId: string): Promise<void>;
  markUsed(accessToken: string, jobId: string | null): Promise<void>;
  /** The request id that used the improvement, or null when it is not used. */
  usedBy(accessToken: string): Promise<string | null>;
};

const CLAIM_RESULTS: readonly ClaimResult[] = ['claimed', 'replay', 'used', 'busy'];

export const profileImprovementFlag: ProfileImprovementFlag = {
  async claim(accessToken, clientRequestId) {
    const data = await getServerGraphqlSdk(accessToken).ClaimProfileImprovement({
      p_client_request_id: clientRequestId,
    });
    const result = data.claim_profile_improvement;
    if (!CLAIM_RESULTS.includes(result as ClaimResult)) {
      throw new Error('claim_profile_improvement returned an unknown result');
    }
    return result as ClaimResult;
  },
  async confirm(accessToken, clientRequestId, jobId) {
    await getServerGraphqlSdk(accessToken).ConfirmProfileImprovement({
      p_client_request_id: clientRequestId,
      p_job_id: jobId,
    });
  },
  async release(accessToken, clientRequestId) {
    await getServerGraphqlSdk(accessToken).ReleaseProfileImprovement({
      p_client_request_id: clientRequestId,
    });
  },
  async markUsed(accessToken, jobId) {
    await getServerGraphqlSdk(accessToken).MarkProfileImprovementUsed({ p_job_id: jobId });
  },
  async usedBy(accessToken) {
    const data = await getServerGraphqlSdk(accessToken).ProfileImprovementRequest();
    const row = unwrapCollection(data.profile_ai_improvementsCollection)[0];
    return row?.used_at ? row.client_request_id : null;
  },
};
