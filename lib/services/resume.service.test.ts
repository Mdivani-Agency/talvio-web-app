import { describe, expect, it, vi } from 'vitest';

const { created, generate, ready } = vi.hoisted(() => {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { created: vi.fn(), generate: vi.fn(), ready: { promise, resolve } };
});

vi.mock('@pdf-tlv/resume', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@pdf-tlv/resume')>();
  class ResumePDFService {
    constructor() {
      created();
    }
    create() {
      return ready.promise;
    }
    generate(...args: unknown[]) {
      return generate(...args);
    }
  }
  return { ...actual, ResumePDFService };
});

import { fullResumeContent } from '../../test/fixtures/flow';

import { resumeService } from './resume.service';

const template = {} as Parameters<typeof resumeService.generate>[1];

describe('resumeService', () => {
  it('builds the PDF service on the first generate, waits for its fonts, and reuses it', async () => {
    expect(created).not.toHaveBeenCalled();
    generate.mockResolvedValue('pdf');

    const first = resumeService.generate(structuredClone(fullResumeContent), template);
    expect(created).toHaveBeenCalledTimes(1);
    // The fonts are still loading: nothing is rendered yet.
    await Promise.resolve();
    expect(generate).not.toHaveBeenCalled();

    ready.resolve();
    await expect(first).resolves.toBe('pdf');
    await resumeService.generate(structuredClone(fullResumeContent), template);

    expect(created).toHaveBeenCalledTimes(1);
    expect(generate).toHaveBeenCalledTimes(2);
  });
});
