import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockGraphqlSdk } from '@/test/mocks/graphql-client';
import type { Resume } from '@lib/types';

vi.mock('@/lib/graphql-client', async () => {
  const actual = await vi.importActual<typeof import('@/test/mocks/graphql-client')>(
    '@/test/mocks/graphql-client',
  );
  return actual;
});

vi.mock('@/lib/clients/media.client', () => ({
  uploadResumePdf: vi.fn(),
}));

vi.mock('@/lib/services/resume.service', () => ({
  generateResumePdf: vi.fn(),
}));

vi.mock('@/lib/templates', () => ({
  findTemplate: vi.fn(() => ({ template: {} })),
}));

import { uploadResumePdf } from '@/lib/clients/media.client';
import { generateResumePdf } from '@/lib/services/resume.service';

import { generateAndPersistPdf } from './use-generate-pdf';

const draft: Resume = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Ann Owner',
  template: 'senior-level-talvio',
  color: '#1B1B1B',
  fontSize: 'md',
  metadata: {
    profile: { firstName: 'Ann', lastName: 'Owner', role: 'Engineer' },
    contacts: { email: 'ann@talvio.test' },
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('generateAndPersistPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGraphqlSdk.Generate_Pdf = vi.fn();
    mockGraphqlSdk.UpdateResume = vi.fn();
  });

  it('returns the existing url without rendering or uploading', async () => {
    const generated = await generateAndPersistPdf({
      ...draft,
      media: { url: 'https://media.talvio.co/ann.pdf', key: 'ann.pdf' },
    });

    expect(generated.media?.url).toBe('https://media.talvio.co/ann.pdf');
    expect(mockGraphqlSdk.Generate_Pdf).not.toHaveBeenCalled();
    expect(generateResumePdf).not.toHaveBeenCalled();
    expect(uploadResumePdf).not.toHaveBeenCalled();
  });

  it('downloads a url returned by generate_pdf without uploading', async () => {
    mockGraphqlSdk.Generate_Pdf = vi.fn().mockResolvedValue({
      generate_pdf: 'https://media.talvio.co/existing.pdf',
    });

    const generated = await generateAndPersistPdf(draft);

    expect(generated.media?.url).toBe('https://media.talvio.co/existing.pdf');
    expect(generateResumePdf).not.toHaveBeenCalled();
    expect(uploadResumePdf).not.toHaveBeenCalled();
  });

  it('renders, uploads, and persists when generate_pdf returns empty', async () => {
    mockGraphqlSdk.Generate_Pdf = vi.fn().mockResolvedValue({ generate_pdf: '' });
    vi.mocked(generateResumePdf).mockResolvedValue(new Blob(['pdf']));
    vi.mocked(uploadResumePdf).mockResolvedValue({
      url: 'https://media.talvio.co/new.pdf',
      key: 'resume/new.pdf',
    });
    mockGraphqlSdk.UpdateResume = vi.fn().mockResolvedValue({
      updateresumesCollection: {
        records: [
          {
            id: draft.id,
            name: draft.name,
            template_key: draft.template,
            color: draft.color,
            font_size: draft.fontSize,
            content: JSON.stringify(draft.metadata),
            pdf_url: 'https://media.talvio.co/new.pdf',
            pdf_media_key: 'resume/new.pdf',
            created_at: draft.createdAt,
            updated_at: draft.updatedAt,
          },
        ],
      },
    });

    const generated = await generateAndPersistPdf(draft);

    expect(generateResumePdf).toHaveBeenCalled();
    expect(uploadResumePdf).toHaveBeenCalled();
    expect(mockGraphqlSdk.UpdateResume).toHaveBeenCalledWith({
      id: draft.id,
      atMost: 1,
      set: {
        pdf_url: 'https://media.talvio.co/new.pdf',
        pdf_media_key: 'resume/new.pdf',
      },
    });
    expect(generated.media?.url).toBe('https://media.talvio.co/new.pdf');
  });

  it('maps GraphQL credit errors before render', async () => {
    mockGraphqlSdk.Generate_Pdf = vi.fn().mockRejectedValue(new Error('Not enough credits'));

    await expect(generateAndPersistPdf(draft)).rejects.toThrow('Not enough credits');
    expect(generateResumePdf).not.toHaveBeenCalled();
    expect(uploadResumePdf).not.toHaveBeenCalled();
  });
});
