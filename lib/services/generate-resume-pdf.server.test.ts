import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  rpc,
  getUser,
  resumeById,
  findTemplate,
  generateResumePdfBytes,
  uploadResumePdfBytes,
} = vi.hoisted(() => ({
  rpc: vi.fn(),
  getUser: vi.fn(),
  resumeById: vi.fn(),
  findTemplate: vi.fn(),
  generateResumePdfBytes: vi.fn(),
  uploadResumePdfBytes: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser },
    rpc,
  })),
}));

vi.mock('@/lib/graphql/server-sdk', () => ({
  getServerGraphqlSdk: vi.fn(async () => ({
    ResumeById: resumeById,
  })),
}));

vi.mock('@/lib/templates', () => ({
  findTemplate,
}));

vi.mock('@/lib/services/resume-pdf.server', () => ({
  generateResumePdfBytes,
}));

vi.mock('@/lib/clients/media.server', () => ({
  uploadResumePdfBytes,
}));

import { generateAndChargeResumePdf } from './generate-resume-pdf.server';

const resume = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Ann Owner',
  template: 'senior-level-talvio',
  color: '#1B1B1B',
  fontSize: 'md' as const,
  metadata: {
    profile: { firstName: 'Ann', lastName: 'Owner', role: 'Engineer' },
    contacts: { email: 'ann@talvio.test' },
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function resumeCollection(row: Record<string, unknown>) {
  return {
    resumesCollection: {
      edges: [{ node: row }],
    },
  };
}

describe('generateAndChargeResumePdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    resumeById.mockResolvedValue(resumeCollection(resume));
    findTemplate.mockReturnValue({ template: {} });
    generateResumePdfBytes.mockResolvedValue(new Uint8Array([1, 2, 3]));
    uploadResumePdfBytes.mockResolvedValue({
      url: 'https://media.talvio.co/new.pdf',
      key: 'resume/new.pdf',
    });
  });

  it('returns an existing url without rendering or charging', async () => {
    resumeById.mockResolvedValue(resumeCollection({
      ...resume,
      pdf_url: 'https://media.talvio.co/ann.pdf',
      pdf_media_key: 'ann.pdf',
      template_key: resume.template,
      font_size: resume.fontSize,
      content: JSON.stringify(resume.metadata),
      created_at: resume.createdAt,
      updated_at: resume.updatedAt,
    }));

    await expect(generateAndChargeResumePdf(resume.id)).resolves.toEqual({
      url: 'https://media.talvio.co/ann.pdf',
      key: 'ann.pdf',
    });
    expect(rpc).not.toHaveBeenCalled();
    expect(generateResumePdfBytes).not.toHaveBeenCalled();
  });

  it('checks balance, generates, then charges only after upload', async () => {
    rpc
      .mockResolvedValueOnce({ data: '', error: null })
      .mockResolvedValueOnce({ data: 'https://media.talvio.co/new.pdf', error: null });
    resumeById.mockResolvedValue(resumeCollection({
      ...resume,
      template_key: resume.template,
      font_size: resume.fontSize,
      content: JSON.stringify(resume.metadata),
      created_at: resume.createdAt,
      updated_at: resume.updatedAt,
    }));

    await expect(generateAndChargeResumePdf(resume.id)).resolves.toEqual({
      url: 'https://media.talvio.co/new.pdf',
      key: 'resume/new.pdf',
    });

    expect(rpc).toHaveBeenNthCalledWith(1, 'generate_pdf', { p_resume_id: resume.id });
    expect(generateResumePdfBytes).toHaveBeenCalled();
    expect(uploadResumePdfBytes).toHaveBeenCalled();
    expect(rpc).toHaveBeenNthCalledWith(2, 'finalize_pdf', {
      p_resume_id: resume.id,
      p_pdf_url: 'https://media.talvio.co/new.pdf',
      p_pdf_media_key: 'resume/new.pdf',
    });
  });

  it('does not render when the balance check fails', async () => {
    rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'insufficient_credits' },
    });
    resumeById.mockResolvedValue(resumeCollection({
      ...resume,
      template_key: resume.template,
      font_size: resume.fontSize,
      content: JSON.stringify(resume.metadata),
      created_at: resume.createdAt,
      updated_at: resume.updatedAt,
    }));

    await expect(generateAndChargeResumePdf(resume.id)).rejects.toMatchObject({
      message: 'Not enough credits',
      status: 402,
    });
    expect(generateResumePdfBytes).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it('does not charge when upload fails after a successful balance check', async () => {
    rpc.mockResolvedValueOnce({ data: '', error: null });
    uploadResumePdfBytes.mockRejectedValue(
      Object.assign(new Error('Failed to upload resume PDF'), { status: 502 }),
    );
    resumeById.mockResolvedValue(resumeCollection({
      ...resume,
      template_key: resume.template,
      font_size: resume.fontSize,
      content: JSON.stringify(resume.metadata),
      created_at: resume.createdAt,
      updated_at: resume.updatedAt,
    }));

    await expect(generateAndChargeResumePdf(resume.id)).rejects.toThrow('Failed to upload resume PDF');
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('generate_pdf', { p_resume_id: resume.id });
  });
});
