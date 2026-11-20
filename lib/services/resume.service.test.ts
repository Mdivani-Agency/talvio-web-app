import { describe, expect, it, vi } from 'vitest';

const { create } = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock('@pdf-tlv/resume', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@pdf-tlv/resume')>();
  return {
    ...actual,
    ResumePDFService: class {
      create = create;
      generate = vi.fn();
    },
  };
});

import { ResumeService } from './resume.service';

describe('ResumeService', () => {
  it('creates the preview renderer without a watermark, so no image fetch can stop the render', () => {
    new ResumeService();

    expect(create).toHaveBeenCalledWith({ color: '#000', fontSize: 'md', leading: 'md' });
    expect(create.mock.calls.at(-1)?.[0]).not.toHaveProperty('watermark');
  });
});
