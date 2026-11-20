import { describe, expect, it } from 'vitest';

import { resumeDraftSchema, resumeFormSchema } from './resume.schema';

const content = {
  profile: { firstName: 'Ada', lastName: 'Owner', role: 'Engineer' },
  contacts: { email: 'ada@example.com' },
};

const issuePaths = (result: { error?: { issues: Array<{ path: PropertyKey[] }> } }) =>
  (result.error?.issues ?? []).map((issue) => issue.path.map(String).join('.'));

describe('resume content sectionOrder', () => {
  it('is optional, so resumes saved before it stay valid', () => {
    expect(resumeFormSchema.safeParse(content).success).toBe(true);
    expect(resumeDraftSchema.safeParse(content).success).toBe(true);
  });

  it('accepts a list of section names', () => {
    const parsed = resumeFormSchema.safeParse({ ...content, sectionOrder: ['education', 'experience'] });
    expect(parsed.success && parsed.data.sectionOrder).toEqual(['education', 'experience']);
  });

  it('rejects anything that is not a short list of names', () => {
    expect(issuePaths(resumeFormSchema.safeParse({ ...content, sectionOrder: 'education' }))).toEqual(['sectionOrder']);
    expect(issuePaths(resumeFormSchema.safeParse({ ...content, sectionOrder: [3] }))).toEqual(['sectionOrder.0']);
    expect(issuePaths(resumeFormSchema.safeParse({ ...content, sectionOrder: Array(13).fill('skills') }))).toEqual([
      'sectionOrder',
    ]);
  });
});
