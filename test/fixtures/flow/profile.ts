import type { Account, AccountDto } from '@lib/types';

import {
  EDUCATION_ID,
  EXPERIENCE_ID,
  FLOW_USER_ID,
  LANGUAGE_ID,
  LINK_ID,
  PROJECT_ID,
  RECOMMENDATION_ID,
  SKILL_ID,
  TOOL_ID,
} from './ids';

/** Every account field the profile schema accepts, including persisted ids. */
export const fullAccountDto: AccountDto = {
  profile: {
    email: 'ada@talvio.test',
    firstName: 'Ada',
    lastName: 'Owner',
    role: 'Staff Engineer',
    tagline: 'Builds hiring products',
    phone: '+1-415-555-0100',
    website: 'https://ada.example',
    city: 'Oakland',
    country: 'United States',
    seniority: 'senior',
  },
  experience: [
    {
      id: EXPERIENCE_ID,
      company: 'Talvio',
      jobTitle: 'Staff Engineer',
      startDate: '2020-01-15T00:00:00.000Z',
      endDate: '2024-06-01T00:00:00.000Z',
      isPresent: false,
      employmentType: 'full-time',
      locationType: 'hybrid',
      additionalDetails: 'Platform group',
      achievements: ['Cut PDF render time'],
      responsibilities: ['Owned the editor'],
      keyContributions: ['Shipped template gallery'],
    },
  ],
  education: [
    {
      id: EDUCATION_ID,
      name: 'State University',
      degreeType: "Bachelor's Degree",
      startDate: '2012-09-01T00:00:00.000Z',
      endDate: '2016-05-15T00:00:00.000Z',
      isPresent: false,
      additionalDetails: 'Computer science',
    },
  ],
  recommendations: [
    {
      id: RECOMMENDATION_ID,
      name: 'Grace Hopper',
      url: 'https://example.com/grace',
      additionalDetails: 'Ada leads calmly.',
    },
  ],
  projects: [
    {
      id: PROJECT_ID,
      name: 'Resume preview',
      url: 'https://example.com/preview',
      additionalDetails: 'Client-side PDF preview',
    },
  ],
  skills: [{ id: SKILL_ID, name: 'TypeScript' }],
  tools: [{ id: TOOL_ID, name: 'Postgres' }],
  links: [{ id: LINK_ID, type: 'github', value: 'https://github.com/ada' }],
  languages: [{ id: LANGUAGE_ID, language: 'English', proficiency: 'native' }],
};

export const savedAccount: Account = {
  ...fullAccountDto,
  id: FLOW_USER_ID,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-02-01T00:00:00.000Z',
};

/** Date-only values `save_profile` persists after `toDateOnly`. */
export const persistedExperienceDates = {
  startDate: '2020-01-15',
  endDate: '2024-06-01',
};
