import { describe, expect, it } from 'vitest';

import { parseGraphqlError, shouldRetryGraphqlQuery } from './graphql-client';

function graphqlError(message: string, code?: string) {
  return {
    response: {
      errors: [{ message, extensions: code ? { code } : {} }],
    },
  };
}

describe('parseGraphqlError', () => {
  it('maps insufficient_credits', () => {
    expect(parseGraphqlError(graphqlError('insufficient_credits'))).toBe(
      'Not enough credits',
    );
  });

  it('maps unknown_action', () => {
    expect(parseGraphqlError(graphqlError('unknown_action'))).toBe(
      'Unknown billing action',
    );
  });

  it('maps resume_not_found', () => {
    expect(parseGraphqlError(graphqlError('resume_not_found'))).toBe('Resume not found');
  });

  it('maps not authenticated', () => {
    expect(parseGraphqlError(graphqlError('not authenticated'))).toBe('Please sign in');
  });

  it('maps 42501 permission denied', () => {
    expect(
      parseGraphqlError(graphqlError('permission denied for table profiles', '42501')),
    ).toBe("You don't have permission to do that");
  });

  it('maps 23505 unique_violation', () => {
    expect(
      parseGraphqlError(graphqlError('duplicate key value violates unique constraint', '23505')),
    ).toBe('That record already exists');
  });

  it('falls back to the GraphQL message', () => {
    expect(parseGraphqlError(graphqlError('custom boom'))).toBe('custom boom');
  });

  it('falls back when the error has no GraphQL payload', () => {
    expect(parseGraphqlError(new Error('network down'))).toBe('network down');
    expect(parseGraphqlError('plain')).toBe('plain');
    expect(parseGraphqlError({})).toBe('Something went wrong');
  });
});

describe('shouldRetryGraphqlQuery', () => {
  it('does not retry auth or permission errors', () => {
    expect(shouldRetryGraphqlQuery(0, graphqlError('not authenticated'))).toBe(false);
    expect(shouldRetryGraphqlQuery(0, graphqlError('permission denied', '42501'))).toBe(false);
  });

  it('retries other errors up to two failures', () => {
    expect(shouldRetryGraphqlQuery(0, graphqlError('custom boom'))).toBe(true);
    expect(shouldRetryGraphqlQuery(1, graphqlError('custom boom'))).toBe(true);
    expect(shouldRetryGraphqlQuery(2, graphqlError('custom boom'))).toBe(false);
  });
});
