import { describe, expect, it } from 'vitest';

import { aiAccessFromToken } from './ai-access';

const token = (claims: Record<string, unknown>) =>
  `x.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.sig`;

describe('aiAccessFromToken', () => {
  it('allows an active account and a token without the claim', () => {
    expect(aiAccessFromToken(token({ sub: 'u', account_status: 'active', plan: 'free' }))).toBe(true);
    expect(aiAccessFromToken(token({ sub: 'u' }))).toBe(true);
  });

  it('refuses a suspended account, no token and a malformed token', () => {
    expect(aiAccessFromToken(token({ sub: 'u', account_status: 'suspended' }))).toBe(false);
    expect(aiAccessFromToken(null)).toBe(false);
    expect(aiAccessFromToken('not-a-jwt')).toBe(false);
  });
});
