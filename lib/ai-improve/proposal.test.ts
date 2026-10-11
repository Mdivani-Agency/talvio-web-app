import { describe, expect, it } from 'vitest';

import { fullAccountDto } from '../../test/fixtures/flow';

import { mergeAccountProposal } from './proposal';

describe('mergeAccountProposal', () => {
  it('keeps omitted source fields when the proposal is partial', () => {
    const merged = mergeAccountProposal(fullAccountDto, {
      profile: { tagline: 'Improved tagline', seniority: 'senior' },
      skills: [{ name: 'Rust' }],
    });

    expect(merged.profile.firstName).toBe('Ada');
    expect(merged.profile.email).toBe(fullAccountDto.profile.email);
    expect(merged.profile.tagline).toBe('Improved tagline');
    expect(merged.profile.seniority).toBe('senior');
    expect(merged.skills).toEqual([{ name: 'Rust' }]);
    expect(merged.experience).toEqual(fullAccountDto.experience);
    expect(merged.projects).toEqual(fullAccountDto.projects);
  });
});
