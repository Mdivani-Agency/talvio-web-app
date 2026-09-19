import { describe, expect, it } from 'vitest';

import type { PreviewDto, Resume } from '@lib/types';

import {
  encodeGraphqlJson,
  isGeneratedResume,
  parseResumeContent,
  resumeToPreviewDto,
  resumeTypeToDb,
  toResume,
  toResumeInsertInput,
  toResumePdfPointerSet,
  toResumeUpdateSet,
} from './resume.adapter';

const content = {
  profile: { firstName: 'Ann', lastName: 'Owner', role: 'Engineer' },
  contacts: { email: 'ann@talvio.test' },
};
const contentJson = encodeGraphqlJson(content);

describe('resumeTypeToDb', () => {
  it('maps REST type enums to GraphQL resume_type', () => {
    expect(resumeTypeToDb('GENERAL')).toBe('general');
    expect(resumeTypeToDb('JOB_SPECIFIC')).toBe('job_specific');
  });
});

describe('parseResumeContent', () => {
  it('parses a pg_graphql JSON string', () => {
    expect(parseResumeContent(contentJson)?.profile.firstName).toBe('Ann');
  });

  it('returns undefined for malformed content instead of throwing', () => {
    expect(parseResumeContent('{"nope":true}')).toBeUndefined();
    expect(parseResumeContent('{')).toBeUndefined();
  });
});

describe('toResume', () => {
  it('maps GraphQL columns onto the app Resume shape', () => {
    const resume = toResume({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Ann Owner',
      type: 'general',
      template_key: 'senior-level-talvio',
      color: '#1B1B1B',
      font_size: 'md',
      font_family: 'Inter',
      content: contentJson,
      pdf_url: 'https://media.talvio.co/ann.pdf',
      pdf_media_key: 'ann.pdf',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z',
    });

    expect(resume).toMatchObject({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Ann Owner',
      template: 'senior-level-talvio',
      fontSize: 'md',
      media: { url: 'https://media.talvio.co/ann.pdf', key: 'ann.pdf' },
    });
    expect(resume.metadata.profile.firstName).toBe('Ann');
  });

  it('omits media when pdf_url is null', () => {
    const resume = toResume({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Draft',
      template_key: 'entry-level-mint',
      color: '#015408',
      font_size: 'sm',
      content: contentJson,
      pdf_url: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    });

    expect(resume.media).toBeUndefined();
  });

  it('uses an empty metadata placeholder when content is invalid', () => {
    const resume = toResume({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Broken',
      template_key: 'entry-level-mint',
      color: '#015408',
      font_size: 'sm',
      content: '{"legacy":true}',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    });

    expect(resume.metadata.contacts.email).toBe('');
    expect(resume.metadata.profile.firstName).toBe('');
  });
});

describe('write adapters', () => {
  it('builds an insert object from PreviewDto with stringified JSON content', () => {
    const body: PreviewDto = {
      name: 'Ann Owner',
      template: 'mid-level-ember',
      color: '#670000',
      fontSize: 'lg',
      resume: {
        profile: {
          firstName: 'Ann',
          lastName: 'Owner',
          role: 'Engineer',
          email: 'ann@talvio.test',
        },
      },
    };

    const input = toResumeInsertInput({ userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', body });

    expect(input).toMatchObject({
      user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      name: 'Ann Owner',
      type: 'general',
      template_key: 'mid-level-ember',
      font_size: 'lg',
    });
    expect(typeof input.content).toBe('string');
    expect(JSON.parse(input.content).profile.firstName).toBe('Ann');
  });

  it('updates draft fields without touching pdf pointers', () => {
    const patch: Partial<Resume> = {
      name: 'Updated',
      color: '#005BA2',
      metadata: parseResumeContent(contentJson),
    };

    const set = toResumeUpdateSet(patch);

    expect(set).toMatchObject({
      name: 'Updated',
      color: '#005BA2',
    });
    expect(set).not.toHaveProperty('pdf_url');
    expect(set).not.toHaveProperty('pdf_media_key');
    expect(typeof set.content).toBe('string');
    expect(JSON.parse(set.content as string).profile.firstName).toBe('Ann');
  });

  it('builds a persist-only pdf pointer set', () => {
    expect(toResumePdfPointerSet('https://media.talvio.co/ann.pdf', 'resume/ann.pdf')).toEqual({
      pdf_url: 'https://media.talvio.co/ann.pdf',
      pdf_media_key: 'resume/ann.pdf',
    });
  });
});

describe('isGeneratedResume', () => {
  it('is true only when a pdf url exists', () => {
    expect(isGeneratedResume({ media: { url: 'https://media.talvio.co/ann.pdf', key: 'ann.pdf' } })).toBe(true);
    expect(isGeneratedResume({ media: undefined })).toBe(false);
    expect(isGeneratedResume(undefined)).toBe(false);
  });
});

describe('resumeToPreviewDto', () => {
  it('copies the row and applies a patch for a new draft insert', () => {
    const resume = toResume({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Ann Owner',
      template_key: 'senior-level-talvio',
      color: '#1B1B1B',
      font_size: 'md',
      content: contentJson,
      pdf_url: 'https://media.talvio.co/ann.pdf',
      pdf_media_key: 'ann.pdf',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    });

    const body = resumeToPreviewDto(resume, { color: '#005BA2', name: 'Ann Owner v2' });
    expect(body).toMatchObject({
      name: 'Ann Owner v2',
      template: 'senior-level-talvio',
      color: '#005BA2',
      fontSize: 'md',
    });
    expect(body.resume.profile.firstName).toBe('Ann');
  });
});
