import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockGraphqlSdk } from '@/test/mocks/graphql-client';

vi.mock('@/lib/graphql-client', async () => {
  const actual = await vi.importActual<typeof import('@/test/mocks/graphql-client')>('@/test/mocks/graphql-client');
  return actual;
});

import { applyProfileProposal, type ProfileApplyRequest } from './use-apply-profile-proposal';

const request = { proposalId: 'p-1', operation: 'improve_profile' } as unknown as ProfileApplyRequest;
const receipt = {
  receiptId: 'r-1',
  proposalId: 'p-1',
  target: { kind: 'profile', profileId: 'u-1' },
  resultingRevision: '2026-11-20T10:00:00Z',
  appliedChangeIds: ['c-1'],
  acceptedOmissionIds: [],
  replayed: false,
};

describe('applyProfileProposal', () => {
  beforeEach(() => {
    mockGraphqlSdk.Apply_Llm_Proposal = vi.fn();
  });

  it('sends the request as JSON and returns the profile receipt', async () => {
    mockGraphqlSdk.Apply_Llm_Proposal = vi.fn().mockResolvedValue({ apply_llm_proposal: JSON.stringify(receipt) });
    await expect(applyProfileProposal(request)).resolves.toMatchObject({ receiptId: 'r-1', target: { kind: 'profile' } });
    expect(mockGraphqlSdk.Apply_Llm_Proposal).toHaveBeenCalledWith({ p_request: JSON.stringify(request) });
  });

  it('explains a refusal because the improvement was not used', async () => {
    mockGraphqlSdk.Apply_Llm_Proposal = vi.fn().mockRejectedValue(new Error('profile_improvement_not_used'));
    await expect(applyProfileProposal(request)).rejects.toThrow('These suggestions can no longer be saved.');
  });

  it('refuses a resume receipt', async () => {
    mockGraphqlSdk.Apply_Llm_Proposal = vi.fn().mockResolvedValue({
      apply_llm_proposal: JSON.stringify({ ...receipt, target: { kind: 'resume', resumeId: 'x' } }),
    });
    await expect(applyProfileProposal(request)).rejects.toThrow('The changes could not be saved.');
  });
});
