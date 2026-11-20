import { beforeEach, describe, expect, it, vi } from 'vitest';

const sdk = {
  ClaimProfileImprovement: vi.fn(),
  ConfirmProfileImprovement: vi.fn(),
  ReleaseProfileImprovement: vi.fn(),
  MarkProfileImprovementUsed: vi.fn(),
  ProfileImprovementRequest: vi.fn(),
};
const getServerGraphqlSdk = vi.fn<(token: string) => typeof sdk>(() => sdk);

vi.mock('@/lib/graphql/server-sdk', () => ({
  getServerGraphqlSdk: (token: string) => getServerGraphqlSdk(token),
}));

import { profileImprovementFlag } from './profile-improvement.server';

const JOB_ID = '7d0c3c1e-1a2b-4c3d-8e4f-5a6b7c8d9e0f';

describe('profileImprovementFlag', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('claims as the user and returns the RPC result', async () => {
    sdk.ClaimProfileImprovement.mockResolvedValue({ claim_profile_improvement: 'replay' });
    await expect(profileImprovementFlag.claim('token-1', 'improve:key-0001')).resolves.toBe('replay');
    expect(getServerGraphqlSdk).toHaveBeenCalledWith('token-1');
    expect(sdk.ClaimProfileImprovement).toHaveBeenCalledWith({ p_client_request_id: 'improve:key-0001' });
  });

  it('refuses an unknown claim result', async () => {
    sdk.ClaimProfileImprovement.mockResolvedValue({ claim_profile_improvement: null });
    await expect(profileImprovementFlag.claim('token-1', 'improve:key-0001')).rejects.toThrow('unknown result');
  });

  it('confirms, releases and marks used with the RPC arguments', async () => {
    await profileImprovementFlag.confirm('token-1', 'improve:key-0001', JOB_ID);
    await profileImprovementFlag.release('token-1', 'improve:key-0001');
    await profileImprovementFlag.markUsed('token-1', null);
    expect(sdk.ConfirmProfileImprovement).toHaveBeenCalledWith({
      p_client_request_id: 'improve:key-0001',
      p_job_id: JOB_ID,
    });
    expect(sdk.ReleaseProfileImprovement).toHaveBeenCalledWith({ p_client_request_id: 'improve:key-0001' });
    expect(sdk.MarkProfileImprovementUsed).toHaveBeenCalledWith({ p_job_id: null });
  });

  it('names the request that used the improvement, and null while it is unused', async () => {
    sdk.ProfileImprovementRequest.mockResolvedValueOnce({
      profile_ai_improvementsCollection: {
        edges: [{ node: { client_request_id: 'improve:key-0001', used_at: '2026-11-20T08:00:00Z' } }],
      },
    });
    await expect(profileImprovementFlag.usedBy('token-1')).resolves.toBe('improve:key-0001');

    sdk.ProfileImprovementRequest.mockResolvedValueOnce({
      profile_ai_improvementsCollection: {
        edges: [{ node: { client_request_id: 'improve:key-0002', used_at: null } }],
      },
    });
    await expect(profileImprovementFlag.usedBy('token-1')).resolves.toBeNull();

    sdk.ProfileImprovementRequest.mockResolvedValueOnce({ profile_ai_improvementsCollection: { edges: [] } });
    await expect(profileImprovementFlag.usedBy('token-1')).resolves.toBeNull();
  });
});
