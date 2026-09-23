import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockGraphqlSdk } from '@/test/mocks/graphql-client';

vi.mock('@/lib/graphql-client', async () => {
  const actual = await vi.importActual<typeof import('@/test/mocks/graphql-client')>(
    '@/test/mocks/graphql-client',
  );
  return actual;
});

import { ResumeConflictError, updateResume } from './use-update-resume';

const resumeId = '11111111-1111-4111-8111-111111111111';

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: resumeId,
    user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    name: 'Ann Owner',
    label: null,
    type: 'general',
    template_key: 'senior-level-talvio',
    color: '#005BA2',
    font_size: 'md',
    font_family: null,
    content: '{}',
    pdf_url: null,
    pdf_media_key: null,
    source_resume_id: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-03T00:00:00.000Z',
    ...overrides,
  };
}

describe('updateResume', () => {
  beforeEach(() => {
    mockGraphqlSdk.UpdateResume = vi.fn();
  });

  it('matches id and updated_at', async () => {
    mockGraphqlSdk.UpdateResume = vi.fn().mockResolvedValue({
      updateresumesCollection: { records: [row()] },
    });

    const resume = await updateResume(resumeId, { color: '#005BA2' }, {
      baseUpdatedAt: '2026-01-02T00:00:00.000Z',
    });

    expect(resume.updatedAt).toBe('2026-01-03T00:00:00.000Z');
    expect(mockGraphqlSdk.UpdateResume).toHaveBeenCalledWith({
      filter: {
        id: { eq: resumeId },
        updated_at: { eq: '2026-01-02T00:00:00.000Z' },
      },
      atMost: 1,
      set: { color: '#005BA2' },
    });
  });

  it('throws a conflict when the revision matches no row', async () => {
    mockGraphqlSdk.UpdateResume = vi.fn().mockResolvedValue({
      updateresumesCollection: { records: [] },
    });

    await expect(updateResume(resumeId, { color: '#005BA2' }, {
      baseUpdatedAt: '2026-01-02T00:00:00.000Z',
    })).rejects.toBeInstanceOf(ResumeConflictError);
  });
});
