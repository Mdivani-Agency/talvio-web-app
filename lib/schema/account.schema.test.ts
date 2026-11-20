import { describe, expect, it } from 'vitest';

import { accountSchema, experienceSchema, persistedIdSchema, skillSchema } from './account.schema';

describe('persistedIdSchema', () => {
  it('keeps UUIDs and drops list keys', () => {
    expect(persistedIdSchema.parse('11111111-1111-4111-8111-111111111111')).toBe(
      '11111111-1111-4111-8111-111111111111',
    );
    expect(persistedIdSchema.parse('experience-0')).toBeUndefined();
    expect(persistedIdSchema.parse(undefined)).toBeUndefined();
  });
});

describe('experienceSchema', () => {
  it('accepts a row id on the path', () => {
    const parsed = experienceSchema.safeParse({
      id: '11111111-1111-4111-8111-111111111111',
      company: 'Talvio',
      jobTitle: 'Engineer',
      startDate: '2020-01-15T00:00:00.000Z',
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.id).toBe('11111111-1111-4111-8111-111111111111');
    }
  });

  it('strips non-uuid ids instead of failing the object', () => {
    const parsed = experienceSchema.safeParse({
      id: 'experience-0',
      company: 'Talvio',
      jobTitle: 'Engineer',
      startDate: '2020-01-15T00:00:00.000Z',
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.id).toBeUndefined();
    }
  });
});

describe('optional template fields', () => {
  const profile = { firstName: 'Ann', lastName: 'Owner', role: 'Engineer', email: 'ann@talvio.test' };
  const issuePaths = (result: { success: boolean; error?: { issues: Array<{ path: PropertyKey[] }> } }) =>
    (result.error?.issues ?? []).map((issue) => issue.path.map(String).join('.'));

  it('accepts a profile without them', () => {
    expect(accountSchema.safeParse({ profile }).success).toBe(true);
  });

  it('accepts all three when filled within the limits', () => {
    const parsed = accountSchema.safeParse({
      profile: { ...profile, groupSkills: true },
      headlineAchievements: [{ value: '1.2 million', label: 'patients on the platform' }],
      skills: [{ name: 'TypeScript', group: 'Languages' }],
      experience: [
        {
          company: 'Talvio',
          jobTitle: 'Engineer',
          startDate: '2020-01-15T00:00:00.000Z',
          stack: ['TypeScript', 'Go'],
        },
      ],
    });

    expect(parsed.success).toBe(true);
  });

  it('limits headline achievements to three, each with a short value and label', () => {
    const tooMany = accountSchema.safeParse({
      profile,
      headlineAchievements: Array.from({ length: 4 }, (_, index) => ({ value: String(index), label: 'items' })),
    });
    expect(issuePaths(tooMany)).toEqual(['headlineAchievements']);

    const tooLong = accountSchema.safeParse({
      profile,
      headlineAchievements: [{ value: 'x'.repeat(25), label: '' }],
    });
    expect(issuePaths(tooLong)).toEqual(['headlineAchievements.0.value', 'headlineAchievements.0.label']);
  });

  it('limits a skill group name to 40 characters', () => {
    expect(issuePaths(skillSchema.safeParse({ name: 'Go', group: 'x'.repeat(41) }))).toEqual(['group']);
    expect(skillSchema.safeParse({ name: 'Go', group: '' }).success).toBe(true);
  });

  it('limits the stack to 8 tags of up to 30 characters', () => {
    const role = { company: 'Talvio', jobTitle: 'Engineer', startDate: '2020-01-15T00:00:00.000Z' };
    expect(issuePaths(experienceSchema.safeParse({ ...role, stack: Array(9).fill('Go') }))).toEqual(['stack']);
    expect(issuePaths(experienceSchema.safeParse({ ...role, stack: ['x'.repeat(31)] }))).toEqual(['stack.0']);
  });
});
