import type { JSONContent } from '@tiptap/react';

import type { ResumeForm } from '@lib/types';

/** Bullets as the editor stores them: one paragraph per bullet in a bullet list. */
function bullets(...items: string[]): JSONContent {
  return {
    type: 'doc',
    content: [
      {
        type: 'bulletList',
        content: items.map((text) => ({
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
        })),
      },
    ],
  };
}

function paragraph(text: string): JSONContent {
  return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] };
}

/** The sample person of the design canvas, with every optional template field filled. */
export const templateSample: ResumeForm = {
  profile: {
    firstName: 'Maya',
    lastName: 'Lindqvist',
    role: 'Staff Software Engineer',
    tagline:
      'Staff engineer with ten years in health tech. I lead platform work that lets small teams ship safely, and I like turning a messy system into one people trust.',
    groupSkills: true,
  },
  contacts: { email: 'maya@lindqvist.dev', phone: '+44 20 7946 0958', url: 'linkedin.com/in/mayalindqvist' },
  location: { city: 'London', country: 'United Kingdom' },
  headlineAchievements: [
    { value: '1.2 million', label: 'patients on the platform' },
    { value: '9 months', label: 'monolith to six services, no downtime' },
    { value: '14', label: 'engineers hired in 18 months' },
  ],
  skills: [
    { name: 'TypeScript', group: 'Languages and frameworks' },
    { name: 'React', group: 'Languages and frameworks' },
    { name: 'Go', group: 'Languages and frameworks' },
    { name: 'PostgreSQL', group: 'Data' },
    { name: 'Kafka', group: 'Data' },
    { name: 'System design', group: 'Architecture' },
    { name: 'Mentoring' },
  ],
  tools: [{ name: 'Terraform' }, { name: 'Datadog' }],
  languages: [
    { language: 'English', proficiency: 'native' },
    { language: 'Swedish', proficiency: 'fluent' },
  ],
  experience: [
    {
      company: 'Northwind Health',
      jobTitle: 'Staff Software Engineer',
      employmentType: 'full-time',
      locationType: 'hybrid',
      startDate: '2022-01-01T00:00:00.000Z',
      isPresent: true,
      stack: ['TypeScript', 'Go', 'PostgreSQL', 'Kafka'],
      description: bullets(
        'Led the move from a monolith to six services in nine months with no downtime.',
        'Grew the platform team from four to fourteen engineers.',
      ),
    },
    {
      company: 'Brightline',
      jobTitle: 'Senior Software Engineer',
      employmentType: 'full-time',
      locationType: 'remote',
      startDate: '2018-03-01T00:00:00.000Z',
      endDate: '2021-12-01T00:00:00.000Z',
      stack: ['React', 'Node.js'],
      description: bullets('Built the booking flow used by 300 clinics.', 'Cut page load time by 40%.'),
    },
  ],
  education: [
    {
      name: 'Uppsala University',
      degreeType: "Master's Degree",
      startDate: '2012-09-01T00:00:00.000Z',
      endDate: '2014-06-01T00:00:00.000Z',
    },
  ],
  projects: [
    {
      name: 'Open triage',
      url: 'https://github.com/maya/open-triage',
      description: paragraph('An open-source triage queue used by three NHS trusts.'),
    },
  ],
  recommendations: [
    {
      name: 'Dr Elena Marsh',
      url: 'https://linkedin.com/in/elenamarsh',
      description: paragraph('Maya made our platform something the whole company relies on.'),
    },
  ],
};

/** The same person without any optional template field: no achievements, no groups, no stacks. */
export const templateSampleWithoutOptionalFields: ResumeForm = {
  ...templateSample,
  profile: { ...templateSample.profile, groupSkills: false },
  headlineAchievements: [],
  skills: templateSample.skills?.map(({ name }) => ({ name })),
  experience: templateSample.experience?.map((entry) => ({ ...entry, stack: [] })),
};

/** A career long enough to run past one page. */
export const templateSampleLong: ResumeForm = {
  ...templateSample,
  experience: Array.from({ length: 7 }, (_, index) => ({
    ...templateSample.experience![index % 2]!,
    company: `Company ${index + 1}`,
    description: bullets(
      'Led a cross-team programme that moved four products onto one shared platform and retired two legacy systems.',
      'Set up the on-call rota, the incident reviews and the runbooks the team still uses.',
      'Mentored six engineers, three of whom now lead teams of their own.',
    ),
  })),
};
