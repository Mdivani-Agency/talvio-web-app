import { describe, expect, it, vi } from 'vitest';

import type { ResumeForm } from '@lib/types';

import { RESUME_FONTS } from '@lib/pdf-templates/fonts';

import { convertToResumeData, generateWithFontFallback, skillGroupsOf } from './resume.service';

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

describe('generateWithFontFallback', () => {
  const params = { data: { name: 'Ada', role: 'Engineer' }, template: { groups: [] } };

  it('renders with the template fonts', async () => {
    const generate = vi.fn().mockResolvedValue(new Uint8Array([1]));
    const state = { fontUnavailable: false };
    await generateWithFontFallback({ generate } as never, params, state);
    expect(generate).toHaveBeenCalledWith(expect.objectContaining({ options: { fonts: RESUME_FONTS } }));
    expect(state.fontUnavailable).toBe(false);
  });

  it('falls back to the standard font when Inter cannot be downloaded, and stops trying', async () => {
    const generate = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValue(new Uint8Array([2]));
    const state = { fontUnavailable: false };
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await expect(generateWithFontFallback({ generate } as never, params, state)).resolves.toEqual(new Uint8Array([2]));
    expect(generate).toHaveBeenLastCalledWith(params);
    expect(state.fontUnavailable).toBe(true);

    await generateWithFontFallback({ generate } as never, params, state);
    expect(generate).toHaveBeenCalledTimes(3);
    expect(generate).toHaveBeenLastCalledWith(params);
    warn.mockRestore();
  });

  it('still fails, and keeps trying the font next time, when the render fails without the font too', async () => {
    const generate = vi.fn().mockRejectedValue(new Error('No Pages created'));
    const state = { fontUnavailable: false };
    await expect(generateWithFontFallback({ generate } as never, params, state)).rejects.toThrow('No Pages created');
    expect(state.fontUnavailable).toBe(false);
  });
});
