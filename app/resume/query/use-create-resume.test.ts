import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EMPTY_RESUME_PREVIEW } from '@lib/drafts';
import { mockGraphqlSdk } from '@/test/mocks/graphql-client';

vi.mock('@/lib/graphql-client', async () => {
  const actual = await vi.importActual<typeof import('@/test/mocks/graphql-client')>(
    '@/test/mocks/graphql-client',
  );
  return actual;
});

import { createResume } from './use-create-resume';

const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const clientDraftId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    user_id: userId,
    name: 'my resume',
    label: null,
    type: 'general',
    template_key: 'senior-level-modern',
    color: '#1B1B1B',
    font_size: 'md',
    font_family: null,
    content: '{}',
    pdf_url: null,
    pdf_media_key: null,
    source_resume_id: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-02T00:00:00.000Z',
    ...overrides,
  };
}

describe('createResume', () => {
  beforeEach(() => {
    mockGraphqlSdk.InsertResume = vi.fn();
    mockGraphqlSdk.ResumeByClientDraft = vi.fn();
    mockGraphqlSdk.UpdateResume = vi.fn();
  });

  it('inserts the client draft id', async () => {
    mockGraphqlSdk.InsertResume = vi.fn().mockResolvedValue({
      insertIntoresumesCollection: { records: [row()] },
    });

    const resume = await createResume({
      userId,
      body: EMPTY_RESUME_PREVIEW,
      clientDraftId,
    });

    expect(resume.id).toBe(row().id);
    expect(mockGraphqlSdk.InsertResume).toHaveBeenCalledWith({
      objects: [expect.objectContaining({ client_draft_id: clientDraftId, user_id: userId })],
    });
    expect(mockGraphqlSdk.ResumeByClientDraft).not.toHaveBeenCalled();
  });

  it('updates the existing mutable row when the client draft id already exists', async () => {
    mockGraphqlSdk.InsertResume = vi.fn().mockRejectedValue(new Error('That record already exists'));
    mockGraphqlSdk.ResumeByClientDraft = vi.fn().mockResolvedValue({
      resumesCollection: { edges: [{ node: row() }] },
    });
    mockGraphqlSdk.UpdateResume = vi.fn().mockResolvedValue({
      updateresumesCollection: {
        records: [row({ name: 'Ann Owner', updated_at: '2026-01-03T00:00:00.000Z' })],
      },
    });

    const resume = await createResume({
      userId,
      body: { ...EMPTY_RESUME_PREVIEW, name: 'Ann Owner' },
      clientDraftId,
    });

    expect(resume.name).toBe('Ann Owner');
    expect(mockGraphqlSdk.UpdateResume).toHaveBeenCalledWith(expect.objectContaining({
      filter: {
        id: { eq: row().id },
        updated_at: { eq: '2026-01-02T00:00:00.000Z' },
      },
    }));
    expect(mockGraphqlSdk.InsertResume).toHaveBeenCalledTimes(1);
  });

  it('returns a generated row for the same client draft without updating it', async () => {
    mockGraphqlSdk.InsertResume = vi.fn().mockRejectedValue(new Error('That record already exists'));
    mockGraphqlSdk.ResumeByClientDraft = vi.fn().mockResolvedValue({
      resumesCollection: {
        edges: [{
          node: row({
            pdf_url: 'https://media.talvio.co/ann.pdf',
            pdf_media_key: 'ann.pdf',
          }),
        }],
      },
    });

    const resume = await createResume({
      userId,
      body: EMPTY_RESUME_PREVIEW,
      clientDraftId,
    });

    expect(resume.media?.url).toBe('https://media.talvio.co/ann.pdf');
    expect(mockGraphqlSdk.UpdateResume).not.toHaveBeenCalled();
  });
});
