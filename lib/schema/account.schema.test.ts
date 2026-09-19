import { describe, expect, it } from 'vitest';

import { experienceSchema, persistedIdSchema } from './account.schema';

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
