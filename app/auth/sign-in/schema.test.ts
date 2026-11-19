import { describe, expect, it } from 'vitest';

import { signInSchema } from './schema';

function emailIssues(email: string) {
  const result = signInSchema.safeParse({ email });
  return result.success ? [] : result.error.issues;
}

describe('signInSchema', () => {
  it('reports one email issue for an empty or blank address', () => {
    for (const email of ['', '   ']) {
      const issues = emailIssues(email);
      expect(issues.map((issue) => issue.path)).toEqual([['email']]);
      expect(issues[0].code).toBe('too_small');
    }
  });

  it('reports one email issue for an address that is not valid', () => {
    for (const email of ['ada', 'ada@talvio', 'ada@@example.com']) {
      const issues = emailIssues(email);
      expect(issues.map((issue) => issue.path)).toEqual([['email']]);
      expect(issues[0].code).not.toBe('too_small');
    }
  });

  it('accepts a valid address and trims it', () => {
    const result = signInSchema.safeParse({ email: '  ada@example.com ' });
    expect(result.success && result.data.email).toBe('ada@example.com');
  });
});
