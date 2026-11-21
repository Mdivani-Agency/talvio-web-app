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

/** The resume editor's recommendation form. The PDF prints the name, the link and the quote. */
export const RECOMMENDATION_FIELDS = {
  name: { label: 'Name', example: 'Who recommends you' },
  url: { label: 'Link', example: 'https://linkedin.com/in/their-profile' },
  additionalDetails: { label: 'Quote', example: 'What they said about your work' },
} as const satisfies Record<string, FieldCopy>;

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
  importLabel: 'Import your resume',
  /** After an import: the same dialog, replacing what the import filled in. */
  againLabel: 'Import again',
} as const;

/** Start faster's line after an import, naming where the details came from. */
export function startFasterImportedBody(source: string): string {
  return `Imported from ${source}. Import again to replace these details.`;
}

/** Client limit for pasted resume text. PDF extraction has no such limit. */
export const MAX_PASTED_RESUME_CHARS = 2000;

const thousands = new Intl.NumberFormat('en-US');

/** One "Import your resume" dialog with Upload a PDF and Paste text (MDI-674, canvas OBF-*). */
export const IMPORT_DIALOG = {
  title: 'Import your resume',
  description: 'We read it and fill in your profile. You check everything before you save.',
  tabsLabel: 'How to import',
  uploadTab: 'Upload a PDF',
  pasteTab: 'Paste text',
  dropTitle: 'Drag your resume PDF here',
  dropTitlePhone: 'Choose your resume PDF',
  dropHint: 'A PDF with selectable text works best',
  choose: 'Choose a PDF',
  ready: 'PDF · ready to import',
  remove: 'Remove',
  pasteLabel: 'Resume text',
  pastePlaceholder: 'Paste the text of your resume here',
  replaceTitle: 'This replaces what you have entered.',
  cancel: 'Cancel',
  import: 'Import',
  replaceAndImport: 'Replace and import',
} as const;

export function notPdfMessage(fileName: string): string {
  return `${fileName} is not a PDF. Choose a PDF, or use Paste text.`;
}

/** The count under the pasted text, and how far over the limit it is. */
export function pasteCountText(length: number): string {
  const base = `${thousands.format(length)} / ${thousands.format(MAX_PASTED_RESUME_CHARS)} characters`;
  const over = length - MAX_PASTED_RESUME_CHARS;
  return over > 0
    ? `${base} · ${thousands.format(over)} over. Cut it down to the main sections, or upload the PDF instead.`
    : base;
}

function listSentence(names: readonly string[]): string {
  if (names.length <= 1) {
    return names[0] ?? '';
  }
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** What the replace warning says the import overwrites: the sections with details, when known. */
export function replaceWarningBody(sections: readonly string[]): string {
  return sections.length > 0
    ? `You have filled in ${listSentence(sections)}. The import overwrites them.`
    : 'The import overwrites the details you have typed.';
}

/** Import on the page lock (LD-import-*). */
export const IMPORT_LOCK = {
  context: 'Import resume',
  title: 'Reading your resume',
  steps: ['Reading the PDF', 'Finding your experience, education and skills', 'Filling in your profile'],
  /** Pasted text has no PDF to read. */
  pastedSteps: ['Reading your text', 'Finding your experience, education and skills', 'Filling in your profile'],
  note: 'The rest of the page is locked until this finishes. If you close the tab, the import keeps going and your profile fills in when you come back.',
  slow: 'Longer resumes take more time. You don’t need to upload it again.',
  offline: 'Your import is paused, not lost. It carries on by itself when you are back online.',
  stop: 'Stop import',
  failure: {
    title: 'We couldn’t read this resume',
    kept: 'Nothing in your profile has changed.',
    primary: 'Paste resume text',
    secondary: 'Back to my profile',
  },
} as const;

/** The panel above the form after an import, until Save profile (OBF-review, OBF-partial). */
export const IMPORT_REVIEW = {
  partialTitle: 'Part of your resume could not be read',
  pastedSource: 'your pasted text',
  checkNote: 'Check',
} as const;

export function importReviewTitle(source: string, partial: boolean): string {
  return partial ? IMPORT_REVIEW.partialTitle : `We filled in your profile from ${source}`;
}

export function importReviewSubtitle(source: string, partial: boolean, count: number): string {
  if (partial) {
    return `We filled in what we could from ${source}. Nothing is saved until you press Save profile.`;
  }
  if (count === 0) {
    return 'Check the details, then save. Nothing is saved until you press Save profile.';
  }
  const things = count === 1 ? '1 thing' : `${count} things`;
  return `Check ${count === 1 ? 'this' : 'these'} ${things}, then save. Nothing is saved until you press Save profile.`;
}

export function goToSectionLabel(section: string): string {
  return `Go to ${section}`;
}

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
export const SECTION_STATUS_TEXT = {
  done: 'complete',
  error: 'has errors',
  todo: 'not started',
  /** After an import, a section the check panel lists (MDI-674). */
  check: 'to check after the import',
} as const;

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
  recommendations: {
    addLabel: 'Add recommendation',
    newTitle: 'New recommendation',
    removeTitle: 'Remove recommendation',
    empty: 'No recommendations added yet.',
  },
} as const satisfies Record<string, EntryListCopy>;

export const entryEditTitle = (name: string) => `Edit ${name}`;
export const entryRemoveLabel = (name: string) => `Remove ${name}`;
export const entryReorderLabel = (name: string) => `Reorder ${name}`;
export const entryRemoveBody = (name: string) => `${name} will be removed. You can add it again later.`;
export const ENTRY_REORDER_HINT = 'Drag, or press the up or down arrow key to move it.';
export const entryMovedAnnouncement = (name: string, position: number, total: number) =>
  `${name} moved to position ${position} of ${total}.`;

/* Optional fields used by some templates (MDI-664). Each hint ends with whether the current template shows the field. */

export const HEADLINE_ACHIEVEMENT_COPY = {
  label: 'Headline achievements (optional)',
  hint: 'A number and what it measures.',
  value: { label: (n: number) => `Achievement ${n} value`, example: '40%' },
  measure: { label: (n: number) => `Achievement ${n} label`, example: 'what it measures' },
  count: (n: number, max: number) => `${n} of ${max}`,
  remove: (n: number) => `Remove achievement ${n}`,
  add: 'Add achievement',
  limitReached: (max: number) => `You can add up to ${max}.`,
} as const;

export const SKILL_GROUP_COPY = {
  switchLabel: 'Group skills',
  offHint: 'Turn on Group skills to sort them under headings.',
  onHint: 'Other templates list all your skills together.',
  groupName: { label: (n: number) => `Group ${n} name`, example: 'Group name' },
  addSkill: (group: string) => `Add a skill to ${group}`,
  removeGroup: (group: string) => `Remove group ${group}`,
  addGroup: 'Add group',
  ungrouped: 'Other',
  ungroupedHint: 'Skills without a group show under Other.',
  untitledGroup: 'this group',
  duplicateSkill: (name: string) => `${name} is already in your skills`,
  duplicateGroup: (name: string) => `There is already a group called ${name}`,
} as const;

export const STACK_COPY = {
  label: 'Stack (optional)',
  example: 'Add a technology',
  hint: (max: number) => `The main tools you used in this role, up to ${max}.`,
  remove: (name: string) => `Remove ${name}`,
} as const;

export const TAG_REMOVE_LABEL = (name: string) => `Remove ${name}`;

/** Which templates show each optional field, in words, for when the current template is not one of them. */
export const OPTIONAL_FIELD_SHOWN_IN = {
  headlineAchievements: { where: 'the Executive template', omitted: 'leaves them out' },
  skillGroups: { where: 'Skills first and Technical', omitted: 'lists skills together' },
  stack: { where: 'the Technical template', omitted: 'leaves it out' },
} as const;

export const shownInYourTemplate = (template: string) => `Shown in your template, ${template}.`;
export const shownElsewhere = (where: string, template: string | undefined, omitted: string) =>
  template ? `Shown in ${where}. Your template, ${template}, ${omitted}.` : `Shown in ${where}.`;
