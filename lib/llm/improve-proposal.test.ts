import { describe, expect, it } from 'vitest';

import { fullResumeContent } from '../../test/fixtures/flow/resume-document';
import { EDUCATION_ID, EXPERIENCE_ID, SKILL_ID } from '../../test/fixtures/flow/ids';
import { resumeToCareerDocument } from './career-document';
import { proposalFromEnvelope, reviewServiceProposal, type ServiceProposal } from './improve-proposal';

const field = (
  id: string,
  section: string,
  entityId: string | null,
  name: string,
  originalValue: unknown,
  proposedValue: unknown,
  required = false,
) => ({
  type: 'field',
  changeKind: required ? 'factual_addition' : 'rewrite',
  id,
  target: { section, entityId, field: name },
  originalValue,
  proposedValue,
  reason: 'Clearer.',
  factIds: [],
  evidence: [],
  confirmation: { required, claims: required ? [{ id: `${id}-claim`, text: 'You led a team of 5.' }] : [] },
});

function proposal(changes: unknown[]): ServiceProposal {
  return { proposalId: 'p-1', summary: 'Suggestions.', changes } as ServiceProposal;
}

describe('resumeToCareerDocument', () => {
  it('maps the resume with row ids, month dates and bullets from the rich text', () => {
    const { document, entities } = resumeToCareerDocument(fullResumeContent);
    expect(document.person).toEqual({
      firstName: 'Ada',
      lastName: 'Owner',
      role: 'Staff Engineer',
      tagline: 'Builds hiring products',
      seniority: null,
    });
    expect(document.contacts).toEqual({ email: 'ada@talvio.test', phone: '+1-415-555-0100', url: 'https://ada.example' });
    expect(document.experience[0]).toMatchObject({
      id: EXPERIENCE_ID,
      company: 'Talvio',
      startDate: '2020-01',
      endDate: '2024-06',
      current: false,
      employmentType: 'contract',
      achievements: ['Cut PDF render time'],
      responsibilities: ['Owned the editor'],
      keyContributions: ['Shipped template gallery'],
    });
    expect(document.education[0]).toMatchObject({ id: EDUCATION_ID, degreeType: 'MBA', startDate: '2012-09' });
    expect(document.education[0]!.description?.blocks[0]).toMatchObject({ type: 'paragraph' });
    expect(document.skills).toEqual([{ id: SKILL_ID, name: 'TypeScript' }]);
    expect(entities[EXPERIENCE_ID]).toEqual({ section: 'experience', index: 0 });
  });

  it('gives entries without a row id a positional id, and leaves unknown values null', () => {
    const { document } = resumeToCareerDocument({
      ...fullResumeContent,
      contacts: { email: '' },
      experience: [{ company: 'Acme', jobTitle: 'Dev', startDate: '2021-03-01T00:00:00.000Z', isPresent: true }],
    });
    expect(document.contacts.email).toBeNull();
    expect(document.experience[0]).toMatchObject({
      id: 'resume:experience:0',
      endDate: null,
      current: true,
      employmentType: null,
      description: null,
    });
  });
});

describe('reviewServiceProposal', () => {
  const { document } = resumeToCareerDocument(fullResumeContent);

  it('applies rewrites whose original still matches and rebuilds the entry rich text', () => {
    const review = reviewServiceProposal(
      fullResumeContent,
      proposal([
        field('c1', 'person', null, 'tagline', 'Builds hiring products', 'Builds hiring products people trust'),
        field('c2', 'experience', EXPERIENCE_ID, 'achievements', ['Cut PDF render time'], ['Cut PDF render time by half']),
      ]),
    );
    expect(review.skipped).toBe(0);
    expect(review.changes.map((change) => [change.section, change.field])).toEqual([
      ['profile', 'tagline'],
      ['experience', 'achievements'],
    ]);
    expect(review.resume.profile.tagline).toBe('Builds hiring products people trust');
    const entry = review.resume.experience?.[0];
    expect(entry?.id).toBe(EXPERIENCE_ID);
    expect(JSON.stringify(entry?.description)).toContain('Cut PDF render time by half');
    expect(review.resume.education).toBe(fullResumeContent.education);
  });

  it('drops a change whose original no longer matches the document', () => {
    const review = reviewServiceProposal(
      fullResumeContent,
      proposal([field('c1', 'person', null, 'tagline', 'Something older', 'New summary')]),
    );
    expect(review.changes).toEqual([]);
    expect(review.skipped).toBe(1);
    expect(review.resume).toBe(fullResumeContent);
  });

  it('applies a change that needs confirmation only once it is confirmed', () => {
    const changes = [
      field('c1', 'education', EDUCATION_ID, 'description', document.education[0]!.description, {
        type: 'doc',
        blocks: [{ type: 'paragraph', content: [{ text: 'Led a study group of 5.' }] }],
      }, true),
      {
        type: 'add_entity',
        changeKind: 'factual_addition',
        id: 'c2',
        addition: { section: 'skills', entity: { id: 'new:skills:0', name: 'Mentoring' } },
        reason: 'From your answers.',
        factIds: [],
        evidence: [],
        confirmation: { required: true, claims: [{ id: 'k2', text: 'You mentor engineers.' }] },
      },
    ];
    const pending = reviewServiceProposal(fullResumeContent, proposal(changes));
    expect(pending.changes.map((change) => change.needsConfirmation)).toEqual([true, true]);
    expect(pending.changes[0]!.claims).toEqual(['You led a team of 5.']);
    expect(pending.resume).toBe(fullResumeContent);

    const confirmed = reviewServiceProposal(fullResumeContent, proposal(changes), new Set(['c1', 'c2']));
    expect(JSON.stringify(confirmed.resume.education?.[0]?.description)).toContain('Led a study group of 5.');
    expect(confirmed.resume.skills).toEqual([{ id: SKILL_ID, name: 'TypeScript' }, { name: 'Mentoring' }]);
  });

  it('skips additions the form cannot hold or already has, and unknown targets', () => {
    const review = reviewServiceProposal(
      fullResumeContent,
      proposal([
        {
          type: 'add_entity',
          changeKind: 'factual_addition',
          id: 'a1',
          addition: { section: 'skills', entity: { id: 'n1', name: 'typescript' } },
          confirmation: { required: true, claims: [{ id: 'k', text: 'x' }] },
        },
        {
          type: 'add_entity',
          changeKind: 'factual_addition',
          id: 'a2',
          addition: { section: 'languages', entity: { id: 'n2', language: 'German', proficiency: null } },
          confirmation: { required: true, claims: [{ id: 'k3', text: 'x' }] },
        },
        field('c3', 'experience', 'not-an-entity', 'achievements', [], ['x']),
        { type: 'something_new', id: 'c4' },
      ]),
    );
    expect(review.changes).toEqual([]);
    expect(review.skipped).toBe(4);
  });

  it('reads the proposal from an improve job result', () => {
    const envelope = { operation: 'improve_resume', result: { proposal: proposal([]) } };
    expect(proposalFromEnvelope(envelope as never)?.proposalId).toBe('p-1');
    expect(proposalFromEnvelope({ operation: 'improve_resume', result: {} } as never)).toBeNull();
  });
});
