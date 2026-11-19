import { describe, expect, it, vi } from 'vitest';

const { created, generate } = vi.hoisted(() => ({ created: vi.fn(), generate: vi.fn() }));

vi.mock('@pdf-tlv/resume', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@pdf-tlv/resume')>();
  class ResumePDFService {
    constructor() {
      created();
    }
    create() {
      return Promise.resolve();
    }
    generate(...args: unknown[]) {
      return generate(...args);
    }
  }
  return { ...actual, ResumePDFService };
});

import { fullResumeContent } from '../../test/fixtures/flow';

import { resumeService } from './resume.service';

describe('resumeService', () => {
  it('builds the PDF service on the first generate, not at import, and reuses it', async () => {
    expect(created).not.toHaveBeenCalled();
    generate.mockResolvedValue('pdf');
    const template = {} as Parameters<typeof resumeService.generate>[1];

    await expect(resumeService.generate(structuredClone(fullResumeContent), template)).resolves.toBe('pdf');
    await resumeService.generate(structuredClone(fullResumeContent), template);

    expect(created).toHaveBeenCalledTimes(1);
    expect(generate).toHaveBeenCalledTimes(2);
  });
});
