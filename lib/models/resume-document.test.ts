import { describe, expect, it } from 'vitest';

import { parseResumeContent, resumeToPreviewDto, toResume, toResumeUpdateSet } from '@/lib/adapters/resume.adapter';
import {
  EDUCATION_ID,
  EXPERIENCE_ID,
  fullAccountDto,
  fullResumeContent,
  LANGUAGE_ID,
  LINK_ID,
  PROJECT_ID,
  RECOMMENDATION_ID,
  SKILL_ID,
  TOOL_ID,
} from '../../test/fixtures/flow';
import { markedBulletDoc } from '../../test/fixtures/flow/rich-text';

import {
  normalizeResumeDocument,
  preserveDocumentFields,
  profileToResumeDocument,
  resumeSubmissionIssues,
} from './resume-document';

describe('profileToResumeDocument', () => {
  it('keeps contacts, location, ids, categorized experience, and rich text', () => {
    const converted = profileToResumeDocument(fullAccountDto);

    expect(converted.contacts.email).toBe(fullAccountDto.profile.email);
    expect(converted.contacts.phone).toBe(fullAccountDto.profile.phone);
    expect(converted.contacts.url).toBe(fullAccountDto.profile.website);
    expect(converted.location).toEqual({
      city: fullAccountDto.profile.city,
      country: fullAccountDto.profile.country,
    });
    expect(converted.profile).toEqual({
      firstName: fullAccountDto.profile.firstName,
      lastName: fullAccountDto.profile.lastName,
      role: fullAccountDto.profile.role,
      tagline: fullAccountDto.profile.tagline,
    });
    expect(converted.skills).toEqual([{ id: SKILL_ID, name: 'TypeScript' }]);
    expect(converted.tools).toEqual([{ id: TOOL_ID, name: 'Postgres' }]);
    expect(converted.links).toEqual([{ id: LINK_ID, type: 'github', value: 'https://github.com/ada' }]);
    expect(converted.languages).toEqual([{ id: LANGUAGE_ID, language: 'English', proficiency: 'native' }]);
    expect(converted.experience?.[0]).toMatchObject({
      id: EXPERIENCE_ID,
      achievements: ['Cut PDF render time'],
      responsibilities: ['Owned the editor'],
      keyContributions: ['Shipped template gallery'],
      employmentType: 'full-time',
      locationType: 'hybrid',
      isPresent: false,
      startDate: '2020-01-15T00:00:00.000Z',
      endDate: '2024-06-01T00:00:00.000Z',
    });
    expect(converted.experience?.[0]?.description).toEqual(
      markedBulletDoc([
        { text: 'Shipped template gallery', mark: 'keyContributions' },
        { text: 'Cut PDF render time', mark: 'achievements' },
        { text: 'Owned the editor', mark: 'responsibilities' },
      ]),
    );
    expect(converted.education?.[0]).toMatchObject({
      id: EDUCATION_ID,
      degreeType: "Bachelor's Degree",
      description: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Computer science' }] }],
      },
    });
    expect(converted.recommendations?.[0]?.id).toBe(RECOMMENDATION_ID);
    expect(converted.projects?.[0]?.id).toBe(PROJECT_ID);

    converted.profile.firstName = 'Changed';
    expect(fullAccountDto.profile.firstName).toBe('Ada');
  });
});

describe('normalizeResumeDocument', () => {
  it('normalizes legacy dates and isPresent and drops synthetic ids', () => {
    const normalized = normalizeResumeDocument({
      profile: { firstName: 'Ada', lastName: 'Owner', role: 'Engineer' },
      contacts: { email: 'ada@talvio.test' },
      experience: [
        {
          id: 'experience-0',
          company: 'Talvio',
          jobTitle: 'Engineer',
          startDate: '2020-01-15',
          endDate: '',
          isPresent: '2024-06-01',
          description: fullResumeContent.experience?.[0]?.description,
        },
      ],
      education: [
        {
          id: EDUCATION_ID,
          name: 'State University',
          degreeType: 'MBA',
          startDate: '2012-09-01',
          isPresent: '',
        },
      ],
    });

    expect(normalized.experience?.[0]?.id).toBeUndefined();
    expect(normalized.experience?.[0]?.startDate).toBe('2020-01-15T00:00:00.000Z');
    expect(normalized.experience?.[0]?.endDate).toBeUndefined();
    expect(normalized.experience?.[0]?.isPresent).toBe(true);
    expect(normalized.experience?.[0]?.description).toEqual(fullResumeContent.experience?.[0]?.description);
    expect(normalized.education?.[0]?.id).toBe(EDUCATION_ID);
    expect(normalized.education?.[0]?.startDate).toBe('2012-09-01T00:00:00.000Z');
    expect(normalized.education?.[0]?.isPresent).toBe(false);
  });

  it('keeps unknown rich-text structure through load and save', () => {
    const description = {
      type: 'doc',
      custom: 'keep-me',
      content: [
        {
          type: 'paragraph',
          attrs: { textAlign: 'left' },
          content: [
            {
              type: 'text',
              text: 'Bold claim',
              marks: [{ type: 'bold', attrs: { reason: 'emphasis' }, extra: true }],
            },
          ],
        },
      ],
    };
    const document = {
      ...fullResumeContent,
      experience: [
        {
          ...fullResumeContent.experience?.[0],
          description,
        },
      ],
    };

    const loaded = parseResumeContent(JSON.stringify(document));
    expect(loaded?.experience?.[0]?.description).toEqual(description);

    const resume = toResume({
      id: '55555555-5555-4555-8555-555555555555',
      name: 'Ada Owner',
      template_key: 'senior-level-talvio',
      color: '#1B1B1B',
      font_size: 'md',
      content: JSON.stringify(document),
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    });
    const preview = resumeToPreviewDto(resume);
    expect(preview.resume.experience?.[0]?.description).toEqual(description);

    const saved = toResumeUpdateSet({ metadata: loaded });
    expect(JSON.parse(saved.content as string).experience[0].description).toEqual(description);
  });
});

describe('preserveDocumentFields', () => {
  it('keeps an existing description and a real id when a dialog replaces the item', () => {
    const current = {
      id: EXPERIENCE_ID,
      company: 'Talvio',
      jobTitle: 'Engineer',
      description: fullResumeContent.experience?.[0]?.description,
    };
    const next = {
      id: 'experience-0',
      company: 'Talvio Labs',
      jobTitle: 'Staff Engineer',
    };

    expect(preserveDocumentFields(current, next)).toEqual({
      id: EXPERIENCE_ID,
      company: 'Talvio Labs',
      jobTitle: 'Staff Engineer',
      description: current.description,
    });
  });
});

describe('resumeSubmissionIssues', () => {
  it('reports a field path when a draft email cannot be generated', () => {
    const issues = resumeSubmissionIssues({
      ...fullResumeContent,
      contacts: { ...fullResumeContent.contacts, email: '' },
    });

    expect(issues.some((issue) => issue.path === 'contacts.email' && issue.message.length > 0)).toBe(true);
    expect(resumeSubmissionIssues(fullResumeContent)).toEqual([]);
  });
});
