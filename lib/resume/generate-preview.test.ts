import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fullResumeContent } from '../../test/fixtures/flow';

const { generate, authedFetch } = vi.hoisted(() => ({
  generate: vi.fn(),
  authedFetch: vi.fn(),
}));

vi.mock('@lib/services/resume.service', () => ({
  resumeService: { generate },
}));

vi.mock('@/lib/supabase/authed-fetch', () => ({
  authedFetch,
}));

import { generateResumePreview } from './generate-preview';

const input = {
  resume: structuredClone(fullResumeContent),
  templateKey: 'senior-level-modern' as const,
  color: '#111111',
  fontSize: 'md' as const,
};

describe('generateResumePreview', () => {
  beforeEach(() => {
    generate.mockReset();
    authedFetch.mockReset();
    generate.mockResolvedValue(new Uint8Array([1, 2, 3]));
  });

  it('renders a watermarked preview and never calls paid generation', async () => {
    const resume = structuredClone(fullResumeContent);
    const result = await generateResumePreview({ ...input, resume });

    expect(result).toEqual(new Uint8Array([1, 2, 3]));
    expect(generate).toHaveBeenCalledTimes(1);
    expect(generate).toHaveBeenCalledWith(
      resume,
      expect.anything(),
      {
        color: '#111111',
        fontSize: 'md',
        isPreview: true,
      },
    );
    expect(authedFetch).not.toHaveBeenCalled();
    expect(resume).toEqual(fullResumeContent);
  });

  it('resolves an unknown template key from the catalogue', async () => {
    await generateResumePreview({
      ...input,
      templateKey: 'not-a-template' as never,
    });

    expect(generate).toHaveBeenCalledWith(
      input.resume,
      expect.anything(),
      expect.objectContaining({ isPreview: true }),
    );
  });
});
