import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireApiUser, generateAndChargeResumePdf } = vi.hoisted(() => ({
  requireApiUser: vi.fn(),
  generateAndChargeResumePdf: vi.fn(),
}));

vi.mock('@/lib/supabase/require-api-user', async () => {
  const actual = await vi.importActual<typeof import('@/lib/supabase/require-api-user')>(
    '@/lib/supabase/require-api-user',
  );
  return {
    ...actual,
    requireApiUser,
  };
});

vi.mock('@/lib/services/generate-resume-pdf.server', () => ({
  GeneratePdfError: class GeneratePdfError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
  generateAndChargeResumePdf,
}));

import { ApiAuthError } from '@/lib/supabase/require-api-user';

import { POST } from './route';

describe('POST /api/resume/generate-pdf', () => {
  beforeEach(() => {
    requireApiUser.mockReset();
    generateAndChargeResumePdf.mockReset();
  });

  it('returns 401 when the caller is not signed in', async () => {
    requireApiUser.mockRejectedValue(new ApiAuthError());

    const response = await POST(new Request('http://localhost/api/resume/generate-pdf', {
      method: 'POST',
      body: JSON.stringify({ resumeId: '11111111-1111-4111-8111-111111111111' }),
    }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Please sign in' });
    expect(generateAndChargeResumePdf).not.toHaveBeenCalled();
  });

  it('generates only after the signed-in owner is resolved', async () => {
    const context = { user: { id: 'user-1' }, accessToken: 'jwt', supabase: {} };
    requireApiUser.mockResolvedValue(context);
    generateAndChargeResumePdf.mockResolvedValue({
      url: 'https://media.talvio.co/ann.pdf',
      key: 'ann.pdf',
    });

    const response = await POST(new Request('http://localhost/api/resume/generate-pdf', {
      method: 'POST',
      headers: { Authorization: 'Bearer jwt' },
      body: JSON.stringify({ resumeId: '11111111-1111-4111-8111-111111111111' }),
    }));

    expect(response.status).toBe(200);
    expect(generateAndChargeResumePdf).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
      context,
    );
  });
});
