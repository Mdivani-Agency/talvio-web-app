import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  rpc,
  resumeById,
  findTemplate,
  generateResumePdfBytes,
  uploadResumePdfBytes,
} = vi.hoisted(() => ({
  rpc: vi.fn(),
  resumeById: vi.fn(),
  findTemplate: vi.fn(),
  generateResumePdfBytes: vi.fn(),
  uploadResumePdfBytes: vi.fn(),
}));

vi.mock('@/lib/graphql/server-sdk', () => ({
  getServerGraphqlSdk: vi.fn(() => ({
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

const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const context = {
  user: { id: userId },
  accessToken: 'user-jwt',
  supabase: { rpc },
} as never;

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

function resumeRow(overrides: Record<string, unknown> = {}) {
  return {
    ...resume,
    user_id: userId,
    template_key: resume.template,
    font_size: resume.fontSize,
    content: JSON.stringify(resume.metadata),
    created_at: resume.createdAt,
    updated_at: resume.updatedAt,
    ...overrides,
  };
}

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
    resumeById.mockResolvedValue(resumeCollection(resumeRow()));
    findTemplate.mockReturnValue({ template: {} });
    generateResumePdfBytes.mockResolvedValue(new Uint8Array([1, 2, 3]));
    uploadResumePdfBytes.mockResolvedValue({
      url: 'https://media.talvio.co/new.pdf',
      key: 'resume/new.pdf',
    });
  });

  it('returns an existing url without rendering or charging', async () => {
    resumeById.mockResolvedValue(resumeCollection(resumeRow({
      pdf_url: 'https://media.talvio.co/ann.pdf',
      pdf_media_key: 'ann.pdf',
    })));

    await expect(generateAndChargeResumePdf(resume.id, context)).resolves.toEqual({
      url: 'https://media.talvio.co/ann.pdf',
      key: 'ann.pdf',
    });
    expect(rpc).not.toHaveBeenCalled();
    expect(generateResumePdfBytes).not.toHaveBeenCalled();
  });

  it('rejects another users resume before rendering', async () => {
    resumeById.mockResolvedValue(resumeCollection(resumeRow({
      user_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    })));

    await expect(generateAndChargeResumePdf(resume.id, context)).rejects.toMatchObject({
      message: 'Resume not found',
      status: 404,
    });
    expect(rpc).not.toHaveBeenCalled();
    expect(generateResumePdfBytes).not.toHaveBeenCalled();
  });

  it('checks balance, generates, then charges only after upload', async () => {
    rpc
      .mockResolvedValueOnce({ data: '', error: null })
      .mockResolvedValueOnce({ data: 'https://media.talvio.co/new.pdf', error: null });

    await expect(generateAndChargeResumePdf(resume.id, context)).resolves.toEqual({
      url: 'https://media.talvio.co/new.pdf',
      key: 'resume/new.pdf',
    });

    expect(rpc).toHaveBeenNthCalledWith(1, 'generate_pdf', { p_resume_id: resume.id });
    expect(generateResumePdfBytes).toHaveBeenCalled();
    expect(uploadResumePdfBytes).toHaveBeenCalledWith(userId, 'Ann Owner.pdf', expect.any(Uint8Array));
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

    await expect(generateAndChargeResumePdf(resume.id, context)).rejects.toMatchObject({
      message: 'Not enough credits',
      status: 402,
    });
    expect(generateResumePdfBytes).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it('returns a stored url from generate_pdf without rendering or releasing', async () => {
    rpc.mockResolvedValueOnce({ data: 'https://media.talvio.co/ann.pdf', error: null });

    await expect(generateAndChargeResumePdf(resume.id, context)).resolves.toEqual({
      url: 'https://media.talvio.co/ann.pdf',
      key: '',
    });
    expect(generateResumePdfBytes).not.toHaveBeenCalled();
    expect(uploadResumePdfBytes).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it('reloads the locked resume before rendering', async () => {
    rpc
      .mockResolvedValueOnce({ data: '', error: null })
      .mockResolvedValueOnce({ data: 'https://media.talvio.co/new.pdf', error: null });
    resumeById
      .mockResolvedValueOnce(resumeCollection(resumeRow({ name: 'Stale Name' })))
      .mockResolvedValueOnce(resumeCollection(resumeRow({ name: 'Ann Owner' })));

    await generateAndChargeResumePdf(resume.id, context);

    expect(resumeById).toHaveBeenCalledTimes(2);
    expect(uploadResumePdfBytes).toHaveBeenCalledWith(userId, 'Ann Owner.pdf', expect.any(Uint8Array));
  });

  it('releases the generation lock when upload fails and does not finalize', async () => {
    rpc.mockResolvedValueOnce({ data: '', error: null });
    uploadResumePdfBytes.mockRejectedValue(
      Object.assign(new Error('Failed to upload resume PDF'), { status: 502 }),
    );

    await expect(generateAndChargeResumePdf(resume.id, context)).rejects.toThrow('Failed to upload resume PDF');
    expect(rpc).toHaveBeenNthCalledWith(1, 'generate_pdf', { p_resume_id: resume.id });
    expect(rpc).toHaveBeenNthCalledWith(2, 'release_resume_generation', { p_resume_id: resume.id });
    expect(rpc).toHaveBeenCalledTimes(2);
  });

  it('releases the lock when finalize reports the revision changed', async () => {
    rpc
      .mockResolvedValueOnce({ data: '', error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'resume_changed' } });

    await expect(generateAndChargeResumePdf(resume.id, context)).rejects.toMatchObject({
      message: 'This resume changed before the PDF was saved',
      status: 409,
    });
    expect(rpc).toHaveBeenNthCalledWith(3, 'release_resume_generation', { p_resume_id: resume.id });
  });
});
