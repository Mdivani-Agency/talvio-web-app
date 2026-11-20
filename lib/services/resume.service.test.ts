import { describe, expect, it } from 'vitest';

import type { ResumeForm } from '@lib/types';

import { convertToResumeData, skillGroupsOf } from './resume.service';

const base: ResumeForm = {
  profile: { firstName: 'Maya', lastName: 'Lindqvist', role: 'Staff Engineer' },
  contacts: { email: 'maya@example.com' },
  skills: [{ name: 'TypeScript' }, { name: 'PostgreSQL' }],
  experience: [
    {
      company: 'Northwind',
      jobTitle: 'Engineer',
      startDate: '2024-01-01T00:00:00.000Z',
      isPresent: true,
    },
  ],
};

describe('convertToResumeData optional template fields', () => {
  it('leaves the optional fields out when they are empty', () => {
    const data = convertToResumeData({
      ...base,
      headlineAchievements: [],
      experience: [{ ...base.experience![0]!, stack: [] }],
    });

    expect(data).not.toHaveProperty('headlineAchievements');
    expect(data).not.toHaveProperty('skillGroups');
    expect(data.experience?.[0]).not.toHaveProperty('stack');
    expect(data.skills).toEqual(['TypeScript', 'PostgreSQL']);
  });

  it('passes headline achievements as value and label', () => {
    const data = convertToResumeData({
      ...base,
      headlineAchievements: [
        { value: ' 1.2 million ', label: 'patients on the platform' },
        { value: '', label: 'dropped when empty' },
      ],
    });

    expect(data.headlineAchievements).toEqual([{ value: '1.2 million', label: 'patients on the platform' }]);
  });

  it('passes the stack of each role', () => {
    const data = convertToResumeData({
      ...base,
      experience: [{ ...base.experience![0]!, stack: ['TypeScript', ' Go ', ''] }],
    });

    expect(data.experience?.[0]?.stack).toEqual(['TypeScript', 'Go']);
  });

  it('passes skill groups only when grouping is on and a skill has a group', () => {
    const grouped: ResumeForm = {
      ...base,
      profile: { ...base.profile, groupSkills: true },
      skills: [
        { name: 'TypeScript', group: 'Languages' },
        { name: 'Docker' },
        { name: 'PostgreSQL', group: 'Data' },
        { name: 'React', group: 'Languages' },
      ],
    };

    expect(convertToResumeData(grouped).skillGroups).toEqual([
      { name: 'Languages', skills: ['TypeScript', 'React'] },
      { name: 'Data', skills: ['PostgreSQL'] },
      { name: 'Other', skills: ['Docker'] },
    ]);
    expect(convertToResumeData(grouped).skills).toEqual(['TypeScript', 'Docker', 'PostgreSQL', 'React']);

    // Off keeps the groups on the skills but the PDF gets one list.
    expect(skillGroupsOf({ ...grouped, profile: { ...grouped.profile, groupSkills: false } })).toBeUndefined();
    // On without any group is one list too.
    expect(skillGroupsOf({ ...base, profile: { ...base.profile, groupSkills: true } })).toBeUndefined();
  });
});
