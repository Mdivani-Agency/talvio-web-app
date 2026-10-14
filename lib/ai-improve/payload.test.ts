import { describe, expect, it } from 'vitest';

import { fullResumeContent } from '../../test/fixtures/flow';
import {
  EDUCATION_ID,
  EXPERIENCE_ID,
  PROJECT_ID,
  RECOMMENDATION_ID,
} from '../../test/fixtures/flow/ids';
import type { AccountDto, DeepPartial, ResumeForm } from '@lib/types';

import { applyAiProposal, documentHash, documentToAiPayload } from './payload';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function plainText(node: unknown): string {
  if (!node || typeof node !== 'object') {
    return '';
  }
  const value = node as { text?: string; content?: unknown[] };
  return `${value.text ?? ''}${(value.content ?? []).map(plainText).join(' ')}`;
}

describe('documentToAiPayload', () => {
  it('maps the document to the account shape the AI routes take', () => {
    const payload = documentToAiPayload(fullResumeContent);

    expect(payload.profile).toEqual({
      firstName: 'Ada',
      lastName: 'Owner',
      role: 'Staff Engineer',
      email: 'ada@talvio.test',
      tagline: 'Builds hiring products',
      phone: '+1-415-555-0100',
      website: 'https://ada.example',
      city: 'Oakland',
      country: 'United States',
    });
    expect(payload.skills).toEqual(fullResumeContent.skills);
    expect(payload.languages).toEqual(fullResumeContent.languages);
    expect(payload.experience?.[0]).toMatchObject({
      id: EXPERIENCE_ID,
      company: 'Talvio',
      achievements: ['Cut PDF render time'],
      responsibilities: ['Owned the editor'],
      keyContributions: ['Shipped template gallery'],
    });
    expect(payload.education?.[0]?.additionalDetails).toContain('distributed systems');
    expect(payload.projects?.[0]?.additionalDetails).toContain('preview pipeline');
    expect(payload.experience?.[0]).not.toHaveProperty('description');
  });

  it('does not change the document', () => {
    const resume = clone(fullResumeContent);
    documentToAiPayload(resume);
    expect(resume).toEqual(fullResumeContent);
  });
});

describe('applyAiProposal', () => {
  it('writes changed text, keeps every id and leaves untouched rich text byte-identical', () => {
    const resume = clone(fullResumeContent);
    const payload = documentToAiPayload(resume);
    const proposal: DeepPartial<AccountDto> = {
      profile: { tagline: 'Builds hiring products people trust', firstName: 'Not applied' },
      experience: [{ ...payload.experience![0], achievements: ['Cut PDF render time by 60%'] }],
      projects: [{ ...payload.projects![0], additionalDetails: 'Rebuilt the preview pipeline for speed.' }],
    };

    const result = applyAiProposal(resume, payload, proposal);

    expect(result.keptSections).toEqual([]);
    expect(result.resume.profile.tagline).toBe('Builds hiring products people trust');
    expect(result.resume.profile.firstName).toBe('Ada');

    const experience = result.resume.experience![0];
    expect(experience.id).toBe(EXPERIENCE_ID);
    expect(plainText(experience.description)).toContain('Cut PDF render time by 60%');
    expect(plainText(experience.description)).toContain('Owned the editor');
    expect(experience.company).toBe('Talvio');
    expect(experience.startDate).toBe('2020-01-15T00:00:00.000Z');

    const project = result.resume.projects![0];
    expect(project.id).toBe(PROJECT_ID);
    expect(plainText(project.description)).toContain('Rebuilt the preview pipeline for speed.');

    expect(result.resume.education![0]).toBe(resume.education![0]);
    expect(JSON.stringify(result.resume.education)).toBe(JSON.stringify(fullResumeContent.education));
    expect(result.resume.recommendations![0].id).toBe(RECOMMENDATION_ID);
    expect(JSON.stringify(result.resume.recommendations)).toBe(JSON.stringify(fullResumeContent.recommendations));
    expect(result.resume.education![0].id).toBe(EDUCATION_ID);

    expect(result.changes.map((change) => [change.section, change.field])).toEqual([
      ['profile', 'tagline'],
      ['experience', 'achievements'],
      ['projects', 'additionalDetails'],
    ]);
    expect(result.changes[1]).toMatchObject({
      index: 0,
      title: 'Talvio',
      before: 'Cut PDF render time',
      after: 'Cut PDF render time by 60%',
    });
  });

  it('keeps a section whose proposed entry count differs and reports it', () => {
    const resume = clone(fullResumeContent);
    const payload = documentToAiPayload(resume);
    const proposal: DeepPartial<AccountDto> = {
      experience: [
        { ...payload.experience![0], achievements: ['Rewritten'] },
        { company: 'Invented Co', jobTitle: 'Engineer', startDate: '2025-01-01T00:00:00.000Z' },
      ],
    };

    const result = applyAiProposal(resume, payload, proposal);

    expect(result.keptSections).toEqual(['experience']);
    expect(result.changes).toEqual([]);
    expect(result.resume).toBe(resume);
  });

  it('returns the same document when nothing changes', () => {
    const resume = clone(fullResumeContent);
    const payload = documentToAiPayload(resume);
    const result = applyAiProposal(resume, payload, { profile: { tagline: 'Builds hiring products' } });

    expect(result.resume).toBe(resume);
    expect(result.changes).toEqual([]);
  });
});

describe('documentHash', () => {
  it('is stable across key order and changes with content', () => {
    const resume = clone(fullResumeContent);
    const reordered = { ...resume, profile: { tagline: resume.profile.tagline, ...resume.profile } } as ResumeForm;
    expect(documentHash(reordered)).toBe(documentHash(resume));

    const edited = { ...resume, profile: { ...resume.profile, role: 'Principal Engineer' } };
    expect(documentHash(edited)).not.toBe(documentHash(resume));
    expect(documentHash(resume)).toMatch(/^[0-9a-f]{8}$/);
  });
});
