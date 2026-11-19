/**
 * Labels, example placeholders and section hints for the profile fields. `/account/create` and the resume editor share
 * these fields, so both read the same constants. A placeholder is an example of the value, never the field's name.
 */

export type FieldCopy = { label: string; example: string };

export const PROFILE_FIELDS = {
  firstName: { label: 'First name', example: 'Maya' },
  lastName: { label: 'Last name', example: 'Lindqvist' },
  role: { label: 'Role', example: 'The role you want next' },
  summary: { label: 'Summary', example: 'Two or three sentences about your work' },
} as const satisfies Record<string, FieldCopy>;

export const CONTACT_FIELDS = {
  email: { label: 'Email', example: 'name@example.com' },
  phone: { label: 'Phone', example: '+44 20 0000 0000' },
  website: { label: 'Website (optional)', example: 'yoursite.com' },
  city: { label: 'City', example: 'London' },
  country: { label: 'Country', example: 'United Kingdom' },
} as const satisfies Record<string, FieldCopy>;

export const HIGHLIGHT_FIELDS = {
  links: { label: 'Other links (optional)', example: 'Add a link' },
  skills: { label: 'Skills', example: 'Add a skill' },
  tools: { label: 'Tools', example: 'Add a tool' },
  language: { label: 'Language', example: 'English' },
  proficiency: { label: 'Proficiency', example: 'Choose a level' },
} as const satisfies Record<string, FieldCopy>;

export const LANGUAGES_LABEL = 'Languages';
export const ADD_LANGUAGE_LABEL = 'Add language';

export const EXPERIENCE_FIELDS = {
  company: { label: 'Company', example: 'Company name' },
  jobTitle: { label: 'Job title', example: 'Your title there' },
  employmentType: { label: 'Employment type', example: 'Full-time' },
  locationType: { label: 'Location type', example: 'Remote' },
  additionalDetails: { label: 'Additional context (optional)', example: 'Anything else about this role' },
} as const satisfies Record<string, FieldCopy>;

export const EDUCATION_FIELDS = {
  name: { label: 'School', example: 'School or university name' },
  degreeType: { label: 'Degree type', example: 'Choose a degree' },
  additionalDetails: { label: 'Additional details (optional)', example: 'Courses, honours or a thesis' },
} as const satisfies Record<string, FieldCopy>;

export const PROJECT_FIELDS = {
  name: { label: 'Project name', example: 'What you built' },
  url: { label: 'Project link (optional)', example: 'github.com/you/project' },
  additionalDetails: { label: 'Description', example: 'What it does and your part in it, in 150 characters or more' },
} as const satisfies Record<string, FieldCopy>;

export type SectionCopy = { title: string; hint?: string };

/** Section headings, in sentence case, with the one-line hint the design shows under some of them. */
export const PROFILE_SECTIONS = {
  about: { title: 'About you' },
  contact: { title: 'Contact information' },
  highlights: { title: 'Highlights' },
  experience: { title: 'Experience', hint: 'Most recent first. Drag to reorder.' },
  education: { title: 'Education' },
  projects: { title: 'Projects', hint: 'Optional. Add work you want on your resumes.' },
} as const satisfies Record<string, SectionCopy>;
