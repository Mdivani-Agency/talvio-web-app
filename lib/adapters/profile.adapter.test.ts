import { describe, expect, it } from 'vitest';

import {
  accountDtoToSavePayload,
  accountFromProfile,
  employmentToApp,
  employmentToDb,
  toBooleanPresent,
  toDateOnly,
  toIsoDateTime,
} from './profile.adapter';

describe('date adapters', () => {
  it('converts date-only and ISO datetimes both ways', () => {
    expect(toIsoDateTime('2020-01-15')).toBe('2020-01-15T00:00:00.000Z');
    expect(toIsoDateTime('2020-01-15T08:30:00.000Z')).toBe('2020-01-15T08:30:00.000Z');
    expect(toDateOnly('2020-01-15T08:30:00.000Z')).toBe('2020-01-15');
    expect(toIsoDateTime(null)).toBeUndefined();
    expect(toDateOnly(undefined)).toBeUndefined();
  });

  it('does not shift midnight UTC dates when formatted as date-only', () => {
    // 2016-09-01T00:00:00.000Z is 2016-08-31 in America/New_York.
    expect(toDateOnly('2016-09-01T00:00:00.000Z')).toBe('2016-09-01');
    expect(toDateOnly('2016-09-01')).toBe('2016-09-01');
  });
});

describe('enum adapters', () => {
  it('maps every employment type both ways', () => {
    const appValues = [
      'full-time',
      'part-time',
      'contract',
      'self-employed',
      'volunteer',
      'internship',
      'apprenticeship',
      'seasonal',
    ] as const;

    for (const value of appValues) {
      const db = employmentToDb(value);
      expect(db).toBeDefined();
      expect(employmentToApp(db)).toBe(value);
    }

    expect(employmentToApp('full_time')).toBe('full-time');
    expect(employmentToDb('self-employed')).toBe('self_employed');
  });
});

describe('isPresent', () => {
  it('treats boolean and non-empty strings as present', () => {
    expect(toBooleanPresent(true)).toBe(true);
    expect(toBooleanPresent(false)).toBe(false);
    expect(toBooleanPresent('2026-01-01T00:00:00.000Z')).toBe(true);
    expect(toBooleanPresent('')).toBe(false);
  });
});

describe('accountFromProfile', () => {
  it('maps profile children, contacts, and enums into AccountDto', () => {
    const account = accountFromProfile(
      {
        user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        first_name: 'Ann',
        last_name: 'Owner',
        role: 'Engineer',
        tagline: 'Builds things',
        seniority: 'mid',
        city: 'Tbilisi',
        country: 'GE',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-02T00:00:00.000Z',
      },
      {
        contacts: [
          { kind: 'email', value: 'ann@talvio.test', is_primary: true, sort_order: 0 },
          { kind: 'phone', value: '+995555', is_primary: true, sort_order: 1 },
          { kind: 'url', value: 'https://ann.test', is_primary: false, sort_order: 2 },
        ],
        experiences: [
          {
            id: '11111111-1111-4111-8111-111111111111',
            company: 'Talvio',
            job_title: 'Engineer',
            employment_type: 'full_time',
            location_type: 'remote',
            start_date: '2020-01-15',
            end_date: null,
            is_present: true,
            achievements: ['Shipped'],
            responsibilities: ['Build'],
            key_contributions: ['Lead'],
            additional_details: 'Notes',
          },
        ],
        educations: [
          {
            id: '22222222-2222-4222-8222-222222222222',
            name: 'TSU',
            degree_type: "Bachelor's Degree",
            start_date: '2016-09-01',
            end_date: '2020-06-01',
            is_present: false,
            additional_details: 'CS',
          },
        ],
        skills: [{ id: '33333333-3333-4333-8333-333333333333', name: 'TypeScript' }],
        tools: [{ name: 'Git' }],
        languages: [{ language: 'en', proficiency: 'fluent' }],
      },
    );

    expect(account.id).toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    expect(account.profile).toMatchObject({
      firstName: 'Ann',
      email: 'ann@talvio.test',
      phone: '+995555',
      website: 'https://ann.test',
      seniority: 'mid',
    });
    expect(account.experience?.[0]).toMatchObject({
      id: '11111111-1111-4111-8111-111111111111',
      jobTitle: 'Engineer',
      employmentType: 'full-time',
      locationType: 'remote',
      isPresent: true,
      startDate: '2020-01-15T00:00:00.000Z',
      additionalDetails: 'Notes',
    });
    expect(account.education?.[0]?.id).toBe('22222222-2222-4222-8222-222222222222');
    expect(account.education?.[0]?.isPresent).toBe(false);
    expect(account.education?.[0]?.endDate).toBe('2020-06-01T00:00:00.000Z');
  });
});

describe('accountDtoToSavePayload', () => {
  it('emits snake employment types, date-only fields, and contact rows', () => {
    const payload = accountDtoToSavePayload({
      profile: {
        firstName: 'Ann',
        lastName: 'Owner',
        role: 'Engineer',
        email: 'ann@talvio.test',
        phone: '+995555',
        website: 'https://ann.test',
        seniority: 'senior',
      },
      experience: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          company: 'Talvio',
          jobTitle: 'Engineer',
          startDate: '2020-01-15T08:00:00.000Z',
          employmentType: 'full-time',
          locationType: 'hybrid',
          isPresent: true,
        },
      ],
      education: [
        {
          id: '22222222-2222-4222-8222-222222222222',
          name: 'TSU',
          degreeType: "Bachelor's Degree",
          startDate: '2016-09-01T00:00:00.000Z',
          isPresent: false,
        },
      ],
    });

    expect(payload).not.toHaveProperty('contacts');
    expect(payload.profile).toMatchObject({
      email: 'ann@talvio.test',
      phone: '+995555',
      website: 'https://ann.test',
    });
    expect(payload.experience[0]).toMatchObject({
      id: '11111111-1111-4111-8111-111111111111',
      employmentType: 'full_time',
      startDate: '2020-01-15',
      isPresent: true,
    });
    expect(payload.education[0]).toMatchObject({
      id: '22222222-2222-4222-8222-222222222222',
      startDate: '2016-09-01',
      isPresent: false,
    });
  });

  it('drops client list keys that are not UUIDs', () => {
    const payload = accountDtoToSavePayload({
      profile: {
        firstName: 'Ann',
        lastName: 'Owner',
        role: 'Engineer',
        email: 'ann@talvio.test',
      },
      experience: [
        {
          id: 'experience-0',
          company: 'Talvio',
          jobTitle: 'Engineer',
          startDate: '2020-01-15T00:00:00.000Z',
        },
      ],
    });

    expect(payload.experience[0].id).toBeUndefined();
  });
});

describe('optional template fields', () => {
  const profileRow = {
    user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    first_name: 'Ann',
    last_name: 'Owner',
    role: 'Engineer',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-02T00:00:00.000Z',
  };

  it('reads them from the rows, with defaults for rows saved before them', () => {
    const empty = accountFromProfile(profileRow, {
      skills: [{ name: 'Go' }],
      experiences: [
        { company: 'Talvio', job_title: 'Engineer', start_date: '2020-01-15', is_present: true },
      ],
    });
    expect(empty.profile.groupSkills).toBe(false);
    expect(empty.headlineAchievements).toEqual([]);
    expect(empty.skills).toEqual([{ id: undefined, name: 'Go' }]);
    expect(empty.experience?.[0]?.stack).toEqual([]);

    const filled = accountFromProfile(
      { ...profileRow, group_skills: true },
      {
        skills: [{ id: '33333333-3333-4333-8333-333333333333', name: 'Go', group_name: 'Backend' }],
        experiences: [
          {
            company: 'Talvio',
            job_title: 'Engineer',
            start_date: '2020-01-15',
            is_present: true,
            stack: ['Go', null, 'Kafka'],
          },
        ],
        headlineAchievements: [
          { id: '44444444-4444-4444-8444-444444444444', value: '40%', label: 'faster releases' },
        ],
      },
    );
    expect(filled.profile.groupSkills).toBe(true);
    expect(filled.skills?.[0]?.group).toBe('Backend');
    expect(filled.experience?.[0]?.stack).toEqual(['Go', 'Kafka']);
    expect(filled.headlineAchievements).toEqual([
      { id: '44444444-4444-4444-8444-444444444444', value: '40%', label: 'faster releases' },
    ]);
  });

  it('sends them to save_profile when the form has them', () => {
    const payload = accountDtoToSavePayload({
      profile: { firstName: 'Ann', lastName: 'Owner', role: 'Engineer', email: 'ann@talvio.test', groupSkills: false },
      headlineAchievements: [{ value: ' 40% ', label: 'faster releases ' }],
      skills: [{ name: 'Go', group: 'Backend' }, { name: 'CSS' }],
      experience: [
        { company: 'Talvio', jobTitle: 'Engineer', startDate: '2020-01-15T00:00:00.000Z', stack: ['Go'] },
      ],
    });

    expect(payload.profile.groupSkills).toBe(false);
    expect(payload.headlineAchievements).toEqual([
      { id: undefined, value: '40%', label: 'faster releases', sortOrder: 0 },
    ]);
    expect(payload.skills.map((row) => row.groupName)).toEqual(['Backend', null]);
    expect(payload.experience[0]?.stack).toEqual(['Go']);
  });

  it('leaves unknown fields out, so save_profile keeps what is stored', () => {
    const payload = accountDtoToSavePayload({
      profile: { firstName: 'Ann', lastName: 'Owner', role: 'Engineer', email: 'ann@talvio.test' },
      experience: [{ company: 'Talvio', jobTitle: 'Engineer', startDate: '2020-01-15T00:00:00.000Z' }],
    });

    expect(payload.profile).not.toHaveProperty('groupSkills');
    expect(payload).not.toHaveProperty('headlineAchievements');
    expect(payload.experience[0]).not.toHaveProperty('stack');
  });
});
