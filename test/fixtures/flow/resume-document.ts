import type { ResumeForm } from '@lib/types';

import {
  LANGUAGE_ID,
  LINK_ID,
  SKILL_ID,
  TOOL_ID,
} from './ids';
import { markedBulletDoc, richParagraphDoc } from './rich-text';

/**
 * Resume document stored in `resumes.content`.
 * Rich text stays JSON. This is not an account DTO.
 */
export const fullResumeContent: ResumeForm = {
  profile: {
    firstName: 'Ada',
    lastName: 'Owner',
    role: 'Staff Engineer',
    tagline: 'Builds hiring products',
  },
  contacts: {
    email: 'ada@talvio.test',
    phone: '+1-415-555-0100',
    url: 'https://ada.example',
  },
  location: {
    city: 'Oakland',
    country: 'United States',
  },
  skills: [{ id: SKILL_ID, name: 'TypeScript' }],
  tools: [{ id: TOOL_ID, name: 'Postgres' }],
  links: [{ id: LINK_ID, type: 'github', value: 'https://github.com/ada' }],
  languages: [{ id: LANGUAGE_ID, language: 'English', proficiency: 'native' }],
  experience: [
    {
      company: 'Talvio',
      jobTitle: 'Staff Engineer',
      startDate: '2020-01-15T00:00:00.000Z',
      endDate: '2024-06-01T00:00:00.000Z',
      isPresent: false,
      employmentType: 'contract',
      locationType: 'remote',
      achievements: ['Cut PDF render time'],
      responsibilities: ['Owned the editor'],
      keyContributions: ['Shipped template gallery'],
      description: markedBulletDoc([
        { text: 'Shipped template gallery', mark: 'keyContributions' },
        { text: 'Cut PDF render time', mark: 'achievements' },
        { text: 'Owned the editor', mark: 'responsibilities' },
      ]),
    },
  ],
  education: [
    {
      name: 'State University',
      degreeType: 'MBA',
      startDate: '2012-09-01T00:00:00.000Z',
      endDate: '2016-05-15T00:00:00.000Z',
      isPresent: false,
      description: richParagraphDoc('distributed systems'),
    },
  ],
  recommendations: [
    {
      name: 'Grace Hopper',
      url: 'https://example.com/grace',
      description: richParagraphDoc('hiring quality'),
    },
  ],
  projects: [
    {
      name: 'Resume preview',
      url: 'https://example.com/preview',
      description: richParagraphDoc('preview pipeline'),
    },
  ],
};
