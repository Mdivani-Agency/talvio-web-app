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
  url: { label: 'Project link (optional)', example: 'https://github.com/you/project' },
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

export const ONBOARDING_HEADING = "Let's build your profile";
export const ONBOARDING_INTRO = 'Add your details once. Every resume you create starts from this profile.';

export const START_FASTER = {
  title: 'Start faster',
  body: 'Import a resume PDF or paste its text to fill in the form. You review everything before saving.',
  importLabel: 'Import from resume',
  pasteLabel: 'Paste resume text',
} as const;

export const SAVE_PROFILE_LABEL = 'Save profile';
export const SAVING_PROFILE_LABEL = 'Saving...';
export const DRAFT_NOTE = 'Unsaved changes are kept on this device as you type.';

export const SECTION_NAV_LABEL = 'Profile sections';
export const SECTION_OPTIONAL_NOTE = 'Optional';

/** The side list's note on a section with errors, such as "Fix 2". */
export function sectionFixNote(count: number): string {
  return `Fix ${count}`;
}

/** Screen reader text for a section's mark in the side list. */
export const SECTION_STATUS_TEXT = { done: 'complete', error: 'has errors', todo: 'not started' } as const;

/** The error summary's heading: "Fix 2 fields to save your profile". */
export function errorSummaryTitle(count: number): string {
  return `Fix ${count} ${count === 1 ? 'field' : 'fields'} to save your profile`;
}

export const ENTRY_CANCEL_LABEL = 'Cancel';
export const ENTRY_SAVE_LABEL = 'Save';
export const ENTRY_PRESENT_LABEL = 'Present';
export const ENTRY_UNTITLED = 'Untitled entry';

export type EntryListCopy = {
  addLabel: string;
  newTitle: string;
  removeTitle: string;
  empty: string;
};

/** Experience, education and project lists: the add button, the new-entry form, the remove confirm and the empty line. */
export const ENTRY_LISTS = {
  experience: {
    addLabel: 'Add experience',
    newTitle: 'New experience',
    removeTitle: 'Remove experience',
    empty: 'No experience added yet.',
  },
  education: {
    addLabel: 'Add education',
    newTitle: 'New education',
    removeTitle: 'Remove education',
    empty: 'No education added yet.',
  },
  projects: {
    addLabel: 'Add project',
    newTitle: 'New project',
    removeTitle: 'Remove project',
    empty: 'No projects added yet.',
  },
} as const satisfies Record<string, EntryListCopy>;

export const entryEditTitle = (name: string) => `Edit ${name}`;
export const entryRemoveLabel = (name: string) => `Remove ${name}`;
export const entryReorderLabel = (name: string) => `Reorder ${name}`;
export const entryRemoveBody = (name: string) => `${name} will be removed. You can add it again later.`;
export const ENTRY_REORDER_HINT = 'Drag, or press the up or down arrow key to move it.';
export const entryMovedAnnouncement = (name: string, position: number, total: number) =>
  `${name} moved to position ${position} of ${total}.`;
