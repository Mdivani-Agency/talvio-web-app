import { describe, expect, it } from 'vitest';

import type { PreviewDto, Resume } from '@lib/types';

import {
  parseResumeContent,
  resumeTypeToDb,
  toResume,
  toResumeInsertInput,
  toResumeUpdateSet,
} from './resume.adapter';

const content = {
  profile: { firstName: 'Ann', lastName: 'Owner', role: 'Engineer' },
  contacts: { email: 'ann@talvio.test' },
};

describe('resumeTypeToDb', () => {
  it('maps REST type enums to GraphQL resume_type', () => {
    expect(resumeTypeToDb('GENERAL')).toBe('general');
    expect(resumeTypeToDb('JOB_SPECIFIC')).toBe('job_specific');
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
      content,
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
      content,
      pdf_url: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    });

    expect(resume.media).toBeUndefined();
  });
});

describe('write adapters', () => {
  it('builds an insert object from PreviewDto', () => {
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

    expect(toResumeInsertInput({ userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', body })).toMatchObject({
      user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      name: 'Ann Owner',
      type: 'general',
      template_key: 'mid-level-ember',
      font_size: 'lg',
    });
  });

  it('clears pdf pointers on update', () => {
    const patch: Partial<Resume> = {
      name: 'Updated',
      color: '#005BA2',
      metadata: parseResumeContent(content),
    };

    expect(toResumeUpdateSet(patch)).toMatchObject({
      name: 'Updated',
      color: '#005BA2',
      pdf_url: null,
      pdf_media_key: null,
    });
  });
});
