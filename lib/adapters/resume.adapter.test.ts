import { describe, expect, it } from 'vitest';

import type { PreviewDto, Resume } from '@lib/types';

import {
  encodeGraphqlJson,
  groupResumeFamilies,
  isGeneratedResume,
  isOpenDraft,
  normalizeResumeLabel,
  resumeDisplayTitle,
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
      label: 'Frontend',
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
      label: 'Frontend',
      template: 'senior-level-talvio',
      fontSize: 'md',
      sourceResumeId: null,
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
      label: 'Frontend',
      template: 'mid-level-ember',
      color: '#670000',
      fontSize: 'lg',
      resume: {
        profile: {
          firstName: 'Ann',
          lastName: 'Owner',
          role: 'Engineer',
        },
        contacts: {
          email: 'ann@talvio.test',
        },
      },
    };

    const input = toResumeInsertInput({
      userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      body,
      sourceResumeId: '11111111-1111-4111-8111-111111111111',
    });

    expect(input).toMatchObject({
      user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      name: 'Ann Owner',
      label: 'Frontend',
      type: 'general',
      template_key: 'mid-level-ember',
      font_size: 'lg',
      source_resume_id: '11111111-1111-4111-8111-111111111111',
    });
    expect(typeof input.content).toBe('string');
    expect(JSON.parse(input.content).profile.firstName).toBe('Ann');
  });

  it('updates draft fields without touching pdf pointers', () => {
    const patch: Partial<Resume> = {
      name: 'Updated',
      label: '  Frontend  ',
      color: '#005BA2',
      metadata: parseResumeContent(contentJson),
    };

    const set = toResumeUpdateSet(patch);

    expect(set).toMatchObject({
      name: 'Updated',
      label: 'Frontend',
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

describe('groupResumeFamilies', () => {
  const generated = toResume({
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
  const draft = toResume({
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Ann Owner draft',
    template_key: 'senior-level-talvio',
    color: '#005BA2',
    font_size: 'md',
    content: contentJson,
    source_resume_id: generated.id,
    created_at: '2026-01-02T00:00:00.000Z',
    updated_at: '2026-01-02T00:00:00.000Z',
  });
  const standalone = toResume({
    id: '33333333-3333-4333-8333-333333333333',
    name: 'New draft',
    template_key: 'entry-level-mint',
    color: '#015408',
    font_size: 'sm',
    content: contentJson,
    created_at: '2026-01-03T00:00:00.000Z',
    updated_at: '2026-01-03T00:00:00.000Z',
  });

  it('groups an open draft under its generated source', () => {
    expect(isOpenDraft(draft)).toBe(true);
    expect(groupResumeFamilies([generated, draft, standalone])).toEqual([
      { id: generated.id, original: generated, draft },
      { id: standalone.id, draft: standalone },
    ]);
  });

  it('renders a draft as its own family when the parent is missing', () => {
    expect(groupResumeFamilies([draft, standalone])).toEqual([
      { id: draft.id, draft },
      { id: standalone.id, draft: standalone },
    ]);
  });
});

describe('resumeDisplayTitle', () => {
  it('prefers a trimmed label and falls back to name', () => {
    expect(normalizeResumeLabel('  Role  ')).toBe('Role');
    expect(normalizeResumeLabel('   ')).toBeNull();
    expect(resumeDisplayTitle({ name: 'Ann Owner', label: 'Frontend' })).toBe('Frontend');
    expect(resumeDisplayTitle({ name: 'Ann Owner' })).toBe('Ann Owner');
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
