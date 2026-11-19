import type { SaveStatus } from '@lib/resume/save-queue';

/**
 * Copy for the resume editor (`/resume` and `/resume/[resumeId]`): the top bar, the panel tabs, the preview stage and
 * the draft banner. The allowance lines stay in `lib/allowance-copy.ts`.
 */

export const EDITOR_BACK = {
  signedIn: { text: 'Documents', label: 'Back to documents', href: '/account/documents' },
  guest: { text: 'Home', label: 'Back to home', href: '/' },
} as const;

export const EDITOR_SIGN_IN = 'Sign in';
export const DOWNLOAD_PDF_LABEL = 'Download PDF';
export const IMPROVE_WITH_AI_LABEL = 'Improve with AI';
export const RETRY_SAVE_LABEL = 'Retry';

/** The title button's name: "Rename resume: Maya Lindqvist". */
export const renameResumeLabel = (title: string) => `Rename resume: ${title}`;
/** The rename field. The download dialog uses the same name for its label field. */
export const RESUME_LABEL_FIELD = 'Resume label';

type SaveContext = { guest: boolean; draft: boolean };

/** The save state under the title, in words. */
export function saveStatusText(status: SaveStatus, { guest, draft }: SaveContext): string {
  switch (status) {
    case 'saved':
      return draft ? 'Draft saved to your account' : 'Saved to your account';
    case 'saved-locally':
      return guest ? 'Saved on this device. Sign in to keep it in your account.' : 'Saved on this device';
    case 'saving':
      return 'Saving…';
    case 'generating':
      return 'Generating your PDF…';
    case 'failed':
      return 'Not saved';
    case 'conflict':
      return 'Changed somewhere else';
  }
}

export const EDITOR_TABS = { content: 'Content', design: 'Design', preview: 'Preview' } as const;
export const EDITOR_PANELS_LABEL = 'Editor panels';
export const EDITOR_VIEWS_LABEL = 'Editor views';
export const TAB_HAS_ERRORS = 'has errors';

export const previewCaption = (templateName: string) => `Preview · ${templateName} template`;
export const pageCountText = (count: number) => `A4 · ${count} ${count === 1 ? 'page' : 'pages'}`;
export const pageOfText = (page: number, count: number) => `Page ${page} of ${count}`;
export const PREVIOUS_PAGE = 'Previous page';
export const NEXT_PAGE = 'Next page';
export const FULL_SIZE_LABEL = 'Full size';
export const previewImageAlt = (page: number) => `Preview of page ${page} of your resume`;

export const DRAFT_BANNER = {
  editing: 'You are editing a draft. Your generated PDF stays downloadable.',
  original: 'Viewing the generated PDF. This version is read-only.',
  viewOriginal: 'View original',
  backToDraft: 'Back to draft',
  discard: 'Discard draft',
} as const;

/** The Design tab until MDI-604 restyles it. */
export const DESIGN_PANEL = {
  template: 'Template',
  accent: 'Accent colour',
  textSize: 'Text size',
  sizes: [
    { value: 'sm', name: 'Small' },
    { value: 'md', name: 'Medium' },
    { value: 'lg', name: 'Large' },
  ],
} as const;

/** The Content tab's accordion, in order. `prefixes` are the form paths each section owns. */
export const RESUME_SECTIONS = [
  { id: 'about', title: 'About you', prefixes: ['profile'] },
  { id: 'contact', title: 'Contact information', prefixes: ['contacts', 'location'] },
  { id: 'highlights', title: 'Highlights', prefixes: ['skills', 'tools', 'languages', 'links'] },
  { id: 'experience', title: 'Experience', prefixes: ['experience'] },
  { id: 'education', title: 'Education', prefixes: ['education'] },
  { id: 'projects', title: 'Projects', prefixes: ['projects'] },
] as const;

export type ResumeSectionId = (typeof RESUME_SECTIONS)[number]['id'];

/** Field names in words, by the last part of a form path, for the error summary and the fix line. */
export const RESUME_FIELD_LABELS: Record<string, string> = {
  firstName: 'First name',
  lastName: 'Last name',
  role: 'Role',
  tagline: 'Summary',
  email: 'Email',
  phone: 'Phone',
  url: 'Website',
  city: 'City',
  country: 'Country',
  skills: 'Skills',
  tools: 'Tools',
  languages: 'Languages',
  language: 'Language',
  proficiency: 'Proficiency',
  links: 'Other links',
  company: 'Company',
  jobTitle: 'Job title',
  startDate: 'Start date',
  endDate: 'End date',
  employmentType: 'Employment type',
  locationType: 'Location type',
  degreeType: 'Degree type',
  additionalDetails: 'Description',
};

export const SECTION_SUMMARY = {
  notStarted: 'Not started yet',
  optionalEmpty: 'Optional · none yet',
  roles: (count: number) => `${count} ${count === 1 ? 'role' : 'roles'}`,
  entries: (count: number) => `${count} ${count === 1 ? 'entry' : 'entries'}`,
  projects: (count: number) => `${count} ${count === 1 ? 'project' : 'projects'}`,
  skills: (count: number) => `${count} ${count === 1 ? 'skill' : 'skills'}`,
  tools: (count: number) => `${count} ${count === 1 ? 'tool' : 'tools'}`,
  languages: (count: number) => `${count} ${count === 1 ? 'language' : 'languages'}`,
  /** "Fix 1 field: first name". */
  fix: (labels: string[]) =>
    `Fix ${labels.length} ${labels.length === 1 ? 'field' : 'fields'}: ${labels.map((label) => label.toLowerCase()).join(', ')}`,
} as const;

/** The error summary's heading after a download finds issues. */
export const downloadErrorSummaryTitle = (count: number) =>
  `Fix ${count} ${count === 1 ? 'field' : 'fields'} to download your PDF`;
