import { describe, expect, it } from 'vitest';

import { accountLookupFromQuery, resolveAccountEntry } from './resolve-account-entry';

describe('accountLookupFromQuery', () => {
  it('treats only a null profile as missing', () => {
    expect(accountLookupFromQuery({ isLoading: true, isError: false, account: undefined })).toBe('loading');
    expect(accountLookupFromQuery({ isLoading: false, isError: true, account: undefined })).toBe('error');
    expect(accountLookupFromQuery({ isLoading: false, isError: false, account: { id: '1' } })).toBe('found');
    expect(accountLookupFromQuery({ isLoading: false, isError: false, account: null })).toBe('missing');
    expect(accountLookupFromQuery({ isLoading: false, isError: false, account: undefined })).toBe('error');
  });
});

describe('resolveAccountEntry', () => {
  it('routes /account from an independent lookup', () => {
    expect(resolveAccountEntry({
      surface: 'account',
      lookup: 'loading',
      step: 'form',
      hasSubmittedProfile: false,
    })).toBe('loading');
    expect(resolveAccountEntry({
      surface: 'account',
      lookup: 'error',
      step: 'form',
      hasSubmittedProfile: false,
    })).toBe('lookup-error');
    expect(resolveAccountEntry({
      surface: 'account',
      lookup: 'found',
      step: 'form',
      hasSubmittedProfile: false,
    })).toBe('dashboard');
    expect(resolveAccountEntry({
      surface: 'account',
      lookup: 'missing',
      step: 'questions',
      hasSubmittedProfile: true,
    })).toBe('redirect-create');
  });

  it('lets /account/create resolve itself and never treats lookup failure as create', () => {
    expect(resolveAccountEntry({
      surface: 'create',
      lookup: 'loading',
      step: 'form',
      hasSubmittedProfile: false,
    })).toBe('loading');
    expect(resolveAccountEntry({
      surface: 'create',
      lookup: 'error',
      step: 'form',
      hasSubmittedProfile: false,
    })).toBe('lookup-error');
    expect(resolveAccountEntry({
      surface: 'create',
      lookup: 'found',
      step: 'form',
      hasSubmittedProfile: false,
    })).toBe('redirect-account');
    expect(resolveAccountEntry({
      surface: 'create',
      lookup: 'missing',
      step: 'form',
      hasSubmittedProfile: false,
    })).toBe('form');
    expect(resolveAccountEntry({
      surface: 'create',
      lookup: 'missing',
      step: 'questions',
      hasSubmittedProfile: false,
    })).toBe('form');
    expect(resolveAccountEntry({
      surface: 'create',
      lookup: 'missing',
      step: 'questions',
      hasSubmittedProfile: true,
    })).toBe('questions');
  });
});
