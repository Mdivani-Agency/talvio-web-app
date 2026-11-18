import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockGraphqlSdk } from '@/test/mocks/graphql-client';

vi.mock('@/lib/graphql-client', async () => {
  const actual = await vi.importActual<typeof import('@/test/mocks/graphql-client')>(
    '@/test/mocks/graphql-client',
  );
  return actual;
});

import type { ApplyRequest } from '@lib/llm/apply';

import { applyLlmProposal } from './use-apply-llm-proposal';

const RESUME_ID = '11111111-1111-4111-8111-111111111111';
const PROPOSAL_ID = '22222222-2222-4222-8222-222222222222';

const request: ApplyRequest = {
  schemaVersion: '1.0',
  proposalId: PROPOSAL_ID,
  jobId: null,
  sessionId: null,
  idempotencyKey: `apply:${PROPOSAL_ID}`,
  operation: 'improve_resume',
  source: { kind: 'resume', id: RESUME_ID, revision: '2026-11-12T10:00:00+00:00', resumeType: 'general', state: 'draft', sourceResumeId: null },
  target: { kind: 'resume_draft', resumeId: RESUME_ID, baseRevision: '2026-11-12T10:00:00+00:00' },
  selectedChangeIds: ['c1'],
  acceptedOmissionIds: [],
  confirmedClaimIds: [],
  resume: { id: RESUME_ID, expectedRevision: '2026-11-12T10:00:00+00:00', content: { profile: {} } },
};

const receipt = {
  receiptId: '33333333-3333-4333-8333-333333333333',
  proposalId: PROPOSAL_ID,
  target: { kind: 'resume', resumeId: RESUME_ID },
  resultingRevision: '2026-11-12T10:05:00+00:00',
  appliedChangeIds: ['c1'],
  acceptedOmissionIds: [],
  replayed: false,
};

describe('applyLlmProposal', () => {
  beforeEach(() => {
    mockGraphqlSdk.Apply_Llm_Proposal = vi.fn();
  });

  it('sends the request as JSON and returns the receipt', async () => {
    mockGraphqlSdk.Apply_Llm_Proposal = vi.fn().mockResolvedValue({ apply_llm_proposal: JSON.stringify(receipt) });

    await expect(applyLlmProposal(request)).resolves.toEqual(receipt);
    expect(mockGraphqlSdk.Apply_Llm_Proposal).toHaveBeenCalledWith({ p_request: JSON.stringify(request) });
  });

  it('explains a stale revision in words', async () => {
    mockGraphqlSdk.Apply_Llm_Proposal = vi.fn().mockRejectedValue(new Error('resume_changed'));

    await expect(applyLlmProposal(request)).rejects.toThrow('This resume changed after the suggestions were made');
  });

  it('refuses an answer that is not a receipt', async () => {
    mockGraphqlSdk.Apply_Llm_Proposal = vi.fn().mockResolvedValue({ apply_llm_proposal: null });

    await expect(applyLlmProposal(request)).rejects.toThrow('The changes could not be saved');
  });
});
