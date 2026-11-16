import { describe, expect, it } from 'vitest';

import { applyErrorMessage, applyIdempotencyKey, applyRequestBase, applySelection } from './apply';

const changes = [
  { id: 'c1', confirmation: { required: false, claims: [] } },
  { id: 'c2', confirmation: { required: true, claims: [{ id: 'k1', text: 'You run Kubernetes.' }] } },
  { id: 'c3', confirmation: { required: true, claims: [{ id: 'k2', text: 'You led a team.' }] } },
  { id: 'c4', confirmation: { required: false, claims: [] } },
];

describe('applySelection', () => {
  it('lists the reviewed changes that apply, their confirmed claims, and the omissions not kept', () => {
    const selection = applySelection({
      // c4 was dropped by the review: its original text no longer matched.
      reviewed: [
        { id: 'c1', needsConfirmation: false },
        { id: 'c2', needsConfirmation: true },
        { id: 'c3', needsConfirmation: true },
      ],
      changes,
      confirmed: new Set(['c2']),
      omissions: [{ id: 'o1' }, { id: 'o2' }],
      kept: new Set(['o2']),
    });
    expect(selection).toEqual({
      selectedChangeIds: ['c1', 'c2'],
      acceptedOmissionIds: ['o1'],
      confirmedClaimIds: ['k1'],
    });
  });
});

describe('applyRequestBase', () => {
  it('keys the request by proposal, so a repeated Accept is the same request', () => {
    const base = applyRequestBase({
      proposalId: 'p-1',
      jobId: 'j-1',
      sessionId: null,
      source: { kind: 'profile', id: 'u-1', revision: 'r' },
      selection: { selectedChangeIds: [], acceptedOmissionIds: [], confirmedClaimIds: [] },
    });
    expect(base).toMatchObject({ schemaVersion: '1.0', proposalId: 'p-1', idempotencyKey: applyIdempotencyKey('p-1') });
    expect(applyIdempotencyKey('p-1')).toBe('apply:p-1');
  });
});

describe('applyErrorMessage', () => {
  it('explains the function errors and leaves others alone', () => {
    expect(applyErrorMessage('resume_changed')).toMatch(/changed after the suggestions/);
    expect(applyErrorMessage('resume_generated')).toMatch(/already has a PDF/);
    expect(applyErrorMessage('network down')).toBeNull();
  });
});
