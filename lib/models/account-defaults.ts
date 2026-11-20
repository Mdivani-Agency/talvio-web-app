import type { AccountDto } from '@lib/types';

/** Empty account draft. Lives outside account UI so resume seeding can reuse it. */
export const DEFAULT_ACCOUNT_DTO: AccountDto = {
  profile: {
    firstName: '',
    lastName: '',
    role: '',
    email: '',
    phone: '',
    website: '',
    tagline: '',
    city: '',
    country: '',
    seniority: 'entry',
    groupSkills: false,
  },
  headlineAchievements: [],
  languages: [],
  links: [],
  experience: [],
  education: [],
  skills: [],
  tools: [],
};
