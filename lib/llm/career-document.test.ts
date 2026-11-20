import { describe, expect, it } from 'vitest';

import { DEFAULT_ACCOUNT_DTO } from '@lib/models/account-defaults';
import type { AccountDto } from '@lib/types';

import { EDUCATION_ID, EXPERIENCE_ID, SKILL_ID, fullAccountDto } from '../../test/fixtures/flow';
import { isoToPartialDate, profileToCareerDocument } from './career-document';

describe('profileToCareerDocument', () => {
  it('converts a full profile, with its row UUIDs as entity ids', () => {
    const { document, entities } = profileToCareerDocument(fullAccountDto);
    expect(document.person).toMatchObject({ firstName: 'Ada', lastName: 'Owner', role: 'Staff Engineer', tagline: 'Builds hiring products' });
    expect(document.contacts).toEqual({ email: 'ada@talvio.test', phone: '+1-415-555-0100', url: 'https://ada.example' });
    expect(document.experience[0]).toMatchObject({
      id: EXPERIENCE_ID,
      company: 'Talvio',
      jobTitle: 'Staff Engineer',
      startDate: '2020-01',
      endDate: '2024-06',
      achievements: ['Cut PDF render time'],
    });
    expect(document.education[0]).toMatchObject({ id: EDUCATION_ID, startDate: '2012-09', endDate: '2016-05' });
    expect(document.skills).toEqual([{ id: SKILL_ID, name: 'TypeScript' }]);
    expect(entities[EXPERIENCE_ID]).toEqual({ section: 'experience', index: 0 });
    expect(entities[SKILL_ID]).toEqual({ section: 'skills', index: 0 });
  });

  it('converts an empty profile', () => {
    const { document, entities } = profileToCareerDocument(DEFAULT_ACCOUNT_DTO);
    expect(document.experience).toEqual([]);
    expect(document.education).toEqual([]);
    expect(document.skills).toEqual([]);
    expect(entities).toEqual({});
  });

  it('keeps partial dates at the precision the profile has', () => {
    const experience = fullAccountDto.experience![0]!;
    const account: AccountDto = {
      ...fullAccountDto,
      experience: [{ ...experience, startDate: '2021', endDate: '2021-03', isPresent: false }],
    };
    expect(profileToCareerDocument(account).document.experience[0]).toMatchObject({ startDate: '2021', endDate: '2021-03' });
  });
});

describe('isoToPartialDate', () => {
  it.each([
    ['2021-03-15T00:00:00.000Z', '2021-03'],
    ['2021-03', '2021-03'],
    ['2021', '2021'],
    ['March 2021', null],
    [undefined, null],
  ])('%s → %s', (value, expected) => {
    expect(isoToPartialDate(value)).toBe(expected);
  });
});
