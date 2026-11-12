import { describe, expect, it } from 'vitest';

import { fullResumeContent } from '../../test/fixtures/flow/resume-document';
import { EDUCATION_ID, EXPERIENCE_ID, SKILL_ID, TOOL_ID } from '../../test/fixtures/flow/ids';
import { reviewTailoring, tailorResultFromEnvelope, type TailorResult } from './tailor';

const rewrite = {
  type: 'field',
  changeKind: 'rewrite',
  id: 'c1',
  target: { section: 'person', entityId: null, field: 'tagline' },
  originalValue: 'Builds hiring products',
  proposedValue: 'Builds data tools for hiring teams',
  reason: 'Matches the job.',
  confirmation: { required: false, claims: [] },
};

const addition = {
  type: 'add_entity',
  changeKind: 'factual_addition',
  id: 'c2',
  addition: { section: 'skills', entity: { id: 'new:skills:0', name: 'Kubernetes' } },
  reason: 'From your answers.',
  confirmation: { required: true, claims: [{ id: 'k1', text: 'You run Kubernetes in production.' }] },
};

function result(omissions: unknown[] = [], changes: unknown[] = [rewrite]): TailorResult {
  return tailorResultFromEnvelope({
    result: {
      proposal: { proposalId: 'p-1', summary: 'Tailored.', changes, omissions },
      requirements: [
        { id: 'r1', text: 'Builds internal tools', kind: 'required' },
        { id: 'r2', text: 'Kubernetes', kind: 'preferred' },
        { id: 'r3', text: 'Hiring domain', kind: 'required' },
      ],
      coverage: [
        { requirementId: 'r1', status: 'supported', note: null },
        { requirementId: 'r2', status: 'supported', note: 'Claimed in an answer.' },
        { requirementId: 'r3', status: 'partial', note: 'One role.' },
      ],
      unsupportedRequirementIds: ['r2'],
    },
  } as never)!;
}

const omit = (id: string, section: string, entityId: string | null, field: string | null, originalValue: unknown = null) => ({
  id,
  section,
  entityId,
  field,
  originalValue,
  reason: 'Not relevant to this job.',
});

describe('reviewTailoring', () => {
  it('applies changes and shows unsupported requirements as gaps', () => {
    const review = reviewTailoring(fullResumeContent, result());
    expect(review.resume.profile.tagline).toBe('Builds data tools for hiring teams');
    expect(review.requirements.map((item) => [item.id, item.status, item.kind])).toEqual([
      ['r1', 'supported', 'required'],
      ['r2', 'missing', 'preferred'],
      ['r3', 'partial', 'required'],
    ]);
  });

  it('adds a new fact only once it is confirmed', () => {
    const tailored = result([], [rewrite, addition]);
    expect(reviewTailoring(fullResumeContent, tailored).resume.skills).toEqual(fullResumeContent.skills);
    expect(reviewTailoring(fullResumeContent, tailored, new Set(['c2'])).resume.skills?.at(-1)).toEqual({ name: 'Kubernetes' });
  });

  it('leaves out omitted entries and fields unless the user keeps them', () => {
    const tailored = result([
      omit('o1', 'skills', SKILL_ID, null),
      omit('o2', 'education', EDUCATION_ID, null),
      omit('o3', 'experience', EXPERIENCE_ID, 'responsibilities', ['Owned the editor']),
      omit('o4', 'tools', 'not-an-entity', null),
    ]);
    const review = reviewTailoring(fullResumeContent, tailored);
    expect(review.omissions.map((item) => item.label)).toEqual([
      'Skills: TypeScript',
      'Education: State University',
      'Experience: Talvio, responsibilities',
    ]);
    expect(review.resume.skills).toEqual([]);
    expect(review.resume.education).toEqual([]);
    expect(review.resume.tools).toEqual([{ id: TOOL_ID, name: 'Postgres' }]);
    const entry = review.resume.experience?.[0];
    expect(entry?.id).toBe(EXPERIENCE_ID);
    expect(JSON.stringify(entry?.description)).not.toContain('Owned the editor');
    expect(JSON.stringify(entry?.description)).toContain('Cut PDF render time');

    const kept = reviewTailoring(fullResumeContent, tailored, new Set(), new Set(['o1', 'o3']));
    expect(kept.resume.skills).toEqual(fullResumeContent.skills);
    expect(kept.resume.education).toEqual([]);
    expect(JSON.stringify(kept.resume.experience?.[0]?.description)).toContain('Owned the editor');
  });

  it('clears an omitted profile summary', () => {
    const review = reviewTailoring(fullResumeContent, result([omit('o1', 'person', null, 'tagline', 'Builds hiring products')], []));
    expect(review.omissions).toEqual([{ id: 'o1', label: 'Profile summary', reason: 'Not relevant to this job.' }]);
    expect(review.resume.profile.tagline).toBe('');
  });

  it('reads only a well-formed tailor result', () => {
    expect(tailorResultFromEnvelope({ result: { proposal: {} } } as never)).toBeNull();
  });
});
