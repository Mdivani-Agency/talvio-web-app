import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createServerPresignedUpload, uploadResumePdfBytes } from './media.server';

const fetchMock = vi.fn();

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('media.server', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('MEDIA_SERVICE_API_KEY', 'test-key');
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://api.example.test/');
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('asks the media service to store the PDF as an attachment with its name', async () => {
    fetchMock.mockResolvedValueOnce(json({ uploadUrl: 'https://s3/up', publicUrl: 'https://media/resume/u/a.pdf', key: 'resume/u/a.pdf' }));

    await createServerPresignedUpload('user-1', 'Ann Owner.pdf');

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://api.example.test/media/presign/user-1');
    expect(JSON.parse(init.body)).toEqual({
      name: 'Ann Owner.pdf',
      type: 'application/pdf',
      path: 'resume',
      disposition: 'attachment',
    });
  });

  it('uploads with the headers the presign signed', async () => {
    const signed = { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="Ann Owner.pdf"' };
    fetchMock
      .mockResolvedValueOnce(json({ uploadUrl: 'https://s3/up', publicUrl: 'https://media/a.pdf', key: 'a.pdf', headers: signed }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));

    await expect(uploadResumePdfBytes('user-1', 'Ann Owner.pdf', new Uint8Array([1, 2]))).resolves.toEqual({
      url: 'https://media/a.pdf',
      key: 'a.pdf',
    });

    const [url, init] = fetchMock.mock.calls[1]!;
    expect(url).toBe('https://s3/up');
    expect(init.headers).toEqual(signed);
  });

  it.each([
    ['no headers', undefined],
    ['malformed headers', { 'Content-Type': 42 }],
  ])('uploads with only the content type when the presign returned %s', async (_label, headers) => {
    fetchMock
      .mockResolvedValueOnce(json({ uploadUrl: 'https://s3/up', publicUrl: 'https://media/a.pdf', key: 'a.pdf', headers }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));

    await uploadResumePdfBytes('user-1', 'Ann Owner.pdf', new Uint8Array([1]));

    expect(fetchMock.mock.calls[1]![1].headers).toEqual({ 'Content-Type': 'application/pdf' });
  });
});
