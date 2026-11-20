import { describe, expect, it } from 'vitest';

import { EXPERIENCE_ID, FLOW_USER_ID, SKILL_ID, fullAccountDto } from '../../test/fixtures/flow';
import type { ServiceProposal } from './improve-proposal';
import { profileApplyRequest, reviewProfileProposal } from './profile-proposal';

const proposal: ServiceProposal = {
  proposalId: '2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e',
  summary: 'Sharper summary, one bullet and a skill.',
  changes: [
    {
      type: 'field',
      id: 'tagline',
      target: { section: 'person', entityId: null, field: 'tagline' },
      originalValue: 'Builds hiring products',
      proposedValue: 'Builds hiring products people trust',
      reason: 'Clearer.',
      confirmation: { required: false, claims: [] },
    },
    {
      type: 'field',
      id: 'achievements',
      target: { section: 'experience', entityId: EXPERIENCE_ID, field: 'achievements' },
      originalValue: ['Cut PDF render time'],
      proposedValue: ['Cut PDF render time by 60%'],
      reason: 'A number from your answer.',
      confirmation: { required: true, claims: [{ id: 'claim-60', text: 'Render time fell by 60%.' }] },
    },
    {
      type: 'add_entity',
      id: 'skill',
      addition: { section: 'skills', entity: { id: 'new:skills:0', name: 'Mentoring' } },
      reason: 'From your answers.',
      confirmation: { required: true, claims: [{ id: 'claim-mentor', text: 'You mentor engineers.' }] },
    },
    {
      type: 'field',
      id: 'stale',
      target: { section: 'person', entityId: null, field: 'role' },
      originalValue: 'Senior Engineer',
      proposedValue: 'Principal Engineer',
      reason: 'Out of date.',
      confirmation: { required: false, claims: [] },
    },
  ],
};

const all = new Set(proposal.changes.map((change) => change.id));
const source = { kind: 'profile' as const, id: FLOW_USER_ID, revision: '2026-02-01T00:00:00.000Z' };

describe('reviewProfileProposal', () => {
  it('starts with every change selected and drops a change the profile no longer matches', () => {
    const review = reviewProfileProposal(fullAccountDto, proposal, all, new Set());
    expect(review.changes.map((change) => change.id)).toEqual(['tagline', 'achievements', 'skill']);
    expect(review.changes.every((change) => change.selected)).toBe(true);
    expect(review.skipped).toBe(1);
    expect(review.account.profile.role).toBe('Staff Engineer');
  });

  it('blocks Save while a selected change has unconfirmed claims', () => {
    const review = reviewProfileProposal(fullAccountDto, proposal, all, new Set(['skill']));
    expect(review.unconfirmed).toEqual(['achievements']);
    expect(review.applied.map((change) => change.id)).toEqual(['tagline', 'skill']);
  });

  it('writes only the selected, confirmed changes into the saved profile', () => {
    const review = reviewProfileProposal(fullAccountDto, proposal, new Set(['tagline', 'achievements']), new Set(['achievements']));
    expect(review.unconfirmed).toEqual([]);
    expect(review.account.profile.tagline).toBe('Builds hiring products people trust');
    expect(review.account.experience![0]).toMatchObject({
      id: EXPERIENCE_ID,
      achievements: ['Cut PDF render time by 60%'],
      // Untouched fields stay as loaded.
      company: 'Talvio',
      startDate: '2020-01-15T00:00:00.000Z',
      endDate: '2024-06-01T00:00:00.000Z',
      responsibilities: ['Owned the editor'],
    });
    expect(review.account.skills).toEqual([{ id: SKILL_ID, name: 'TypeScript' }]);
    expect(review.account.profile.email).toBe('ada@talvio.test');
  });

  it('writes an accepted change that clears the tagline', () => {
    const clear: ServiceProposal = {
      ...proposal,
      changes: [{ ...proposal.changes[0]!, id: 'clear', proposedValue: '' }],
    };
    const review = reviewProfileProposal(fullAccountDto, clear, new Set(['clear']), new Set());
    expect(review.applied.map((change) => change.id)).toEqual(['clear']);
    expect(review.account.profile.tagline).toBe('');
  });

  it('adds a confirmed skill as a new row', () => {
    const review = reviewProfileProposal(fullAccountDto, proposal, new Set(['skill']), new Set(['skill']));
    expect(review.account.skills).toEqual([{ id: SKILL_ID, name: 'TypeScript' }, { name: 'Mentoring' }]);
  });
});

describe('profileApplyRequest', () => {
  it('builds the improve_profile request with the selection and the save_profile payload', () => {
    const confirmed = new Set(['achievements']);
    const review = reviewProfileProposal(fullAccountDto, proposal, new Set(['tagline', 'achievements']), confirmed);
    const request = profileApplyRequest({ review, proposal, confirmed, jobId: 'job-1', sessionId: 'session-1', source });
    expect(request).toMatchObject({
      proposalId: proposal.proposalId,
      jobId: 'job-1',
      sessionId: 'session-1',
      idempotencyKey: `apply:${proposal.proposalId}`,
      operation: 'improve_profile',
      source,
      target: { kind: 'profile', profileId: FLOW_USER_ID, baseRevision: source.revision },
      selectedChangeIds: ['tagline', 'achievements'],
      confirmedClaimIds: ['claim-60'],
      acceptedOmissionIds: [],
    });
    expect(request.profile.profile.tagline).toBe('Builds hiring products people trust');
    expect(request.profile.experience[0]).toMatchObject({
      id: EXPERIENCE_ID,
      achievements: ['Cut PDF render time by 60%'],
      startDate: '2020-01-15',
      endDate: '2024-06-01',
    });
  });
});
