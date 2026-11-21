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
/** Saves a new resume to the account without creating a PDF. Not "Save": each entry form has its own Save. */
export const SAVE_RESUME_LABEL = 'Save resume';
export const SAVING_RESUME_LABEL = 'Saving…';
export const RESUME_SAVED_TOAST = 'Resume saved to your account';
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
/** A toggle beside Full size: the page fills the stage's width, up to A4 at real size, and the stage scrolls. */
export const FIT_WIDTH_LABEL = 'Fit width';
export const previewImageAlt = (page: number) => `Preview of page ${page} of your resume`;

export const DRAFT_BANNER = {
  editing: 'You are editing a draft. Your generated PDF stays downloadable.',
  original: 'Viewing the generated PDF. This version is read-only.',
  viewOriginal: 'View original',
  backToDraft: 'Back to draft',
  discard: 'Discard draft',
} as const;

/** The Design tab: template, accent colour and text size. */
export const DESIGN_PANEL = {
  template: 'Template',
  /** Beside the heading, announced: "14 templates", or "4 of 14" with a filter on. */
  templateCount: (shown: number, total: number) => (shown === total ? `${total} templates` : `${shown} of ${total}`),
  selected: (name: string) => `${name} is selected`,
  summary: (description: string, bestFor: string) => `${description}. Best for ${bestFor}.`,
  sectionOrder: (names: string, custom: boolean) =>
    custom ? `Section order: your own (${names}).` : `Section order: ${names}.`,
  optionalFields: (fields: string) => `Shows optional fields: ${fields}. Empty ones are left out.`,
  fillThemIn: 'Fill them in',
  /** The optional fields as the info box lists them. */
  optionalFieldNames: {
    headlineAchievements: 'headline achievements',
    skillGroups: 'skill groups',
    stack: 'a stack per role',
  },
  accent: 'Accent colour',
  textSize: 'Text size',
  sizes: [
    { value: 'sm', name: 'Small' },
    { value: 'md', name: 'Medium' },
    { value: 'lg', name: 'Large' },
  ],
} as const;

/** A small template card: "Modern template", or "Modern template, selected". */
export const templateButtonLabel = (name: string, selected: boolean) => `${name} template${selected ? ', selected' : ''}`;

/** The resume accent colours by `RESUME_COLORS_MAP` key, in the order the Design tab shows them. */
export const ACCENT_COLOURS = [
  { key: 'black', name: 'Black' },
  { key: 'talvio', name: 'Talvio blue' },
  { key: 'mint', name: 'Mint' },
  { key: 'ember', name: 'Ember' },
  { key: 'grayLight', name: 'Grey' },
  { key: 'brown', name: 'Brown' },
  { key: 'red', name: 'Rust' },
  { key: 'yellow', name: 'Gold' },
] as const;

/** The Generate your PDF dialog. The allowance lines stay in `lib/allowance-copy.ts`. */
export const GENERATE_DIALOG = {
  title: 'Generate your PDF',
  fileName: 'File name',
  fileNamePlaceholder: 'Enter a file name',
  label: 'Label (optional)',
  labelHint: 'Only you see it, in your documents list.',
  redownloadsFree: 'Re-downloads of a generated PDF are always free.',
  cancel: 'Cancel',
  generate: 'Generate PDF',
  download: 'Download',
  improve: 'Improve with AI first',
} as const;

/** The Generate dialog once the PDF exists (a new one, or a resume that already has one). */
export const PDF_READY_DIALOG = {
  title: 'Your PDF is ready',
  body: (fileName: string) => `${fileName} is saved in your account. Download it, or open it in a new tab.`,
  download: 'Download PDF',
  open: 'Open in new tab',
  done: 'Done',
} as const;

/** Toasts for Download and Open on any generated PDF (editor, account page, documents, applications). */
export const PDF_ACTION_MESSAGES = {
  failed: 'Could not load the PDF. Check your connection and try again.',
  tabBlocked: 'Your browser blocked the new tab.',
  openAnyway: 'Open PDF',
} as const;

/** The Content tab's accordion, in order. `prefixes` are the form paths each section owns. */
export const RESUME_SECTIONS = [
  { id: 'about', title: 'About you', prefixes: ['profile', 'headlineAchievements'] },
  { id: 'contact', title: 'Contact information', prefixes: ['contacts', 'location'] },
  { id: 'highlights', title: 'Highlights', prefixes: ['skills', 'tools', 'languages', 'links'] },
  { id: 'experience', title: 'Experience', prefixes: ['experience'] },
  { id: 'education', title: 'Education', prefixes: ['education'] },
  { id: 'projects', title: 'Projects', prefixes: ['projects'] },
  { id: 'recommendations', title: 'Recommendations', prefixes: ['recommendations'] },
] as const;

export type ResumeSectionId = (typeof RESUME_SECTIONS)[number]['id'];

export const RECOMMENDATIONS_INTRO = 'Optional. A short quote from someone you worked with.';

/** The Content tab's section order (MDI-665): the line under Contact information and the Reorder sections list. */
export const SECTION_ORDER_COPY = {
  /** Short names, for the order line. Skills carries tools and languages. */
  shortNames: {
    experience: 'Experience',
    education: 'Education',
    skills: 'Skills',
    projects: 'Projects',
    recommendations: 'Recommendations',
  },
  /** Long names, for the list rows and announcements. */
  longNames: {
    experience: 'Experience',
    education: 'Education',
    skills: 'Skills, tools and languages',
    projects: 'Projects',
    recommendations: 'Recommendations',
  },
  templateOrder: (template: string) => `${template} order:`,
  yourOrder: 'Your order:',
  reorder: 'Reorder sections',
  title: 'Section order',
  intro: 'Drag a section, or use the arrows. Your name, contact details and summary always come first.',
  position: (index: number, total: number) => `${index} of ${total}`,
  drag: (name: string) => `Drag to move ${name}`,
  moveUp: (name: string) => `Move ${name} up`,
  moveDown: (name: string) => `Move ${name} down`,
  moved: (name: string, direction: 'up' | 'down', index: number, total: number) =>
    `${name} moved ${direction}. Now ${index} of ${total}.`,
  reset: (template: string) => `Reset to the ${template} order`,
  resetDone: (template: string) => `Order reset to the ${template} template.`,
  done: 'Done',
  /** Two-column templates keep each section in its column. */
  columnNote: (template: string) =>
    `In the ${template} template, skills and education stay in the side column. The order applies within each column.`,
} as const;

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
  headlineAchievements: 'Headline achievements',
  value: 'Achievement value',
  label: 'What it measures',
  stack: 'Stack',
  group: 'Skill group',
};

export const SECTION_SUMMARY = {
  notStarted: 'Not started yet',
  optionalEmpty: 'Optional · none yet',
  roles: (count: number) => `${count} ${count === 1 ? 'role' : 'roles'}`,
  entries: (count: number) => `${count} ${count === 1 ? 'entry' : 'entries'}`,
  projects: (count: number) => `${count} ${count === 1 ? 'project' : 'projects'}`,
  skills: (count: number) => `${count} ${count === 1 ? 'skill' : 'skills'}`,
  /** "4 skills in 3 groups", when Group skills is on. */
  groupedSkills: (count: number, groups: number) =>
    `${count} ${count === 1 ? 'skill' : 'skills'} in ${groups} ${groups === 1 ? 'group' : 'groups'}`,
  achievements: (count: number) => `${count} ${count === 1 ? 'achievement' : 'achievements'}`,
  recommendations: (count: number) => `${count} ${count === 1 ? 'recommendation' : 'recommendations'}`,
  tools: (count: number) => `${count} ${count === 1 ? 'tool' : 'tools'}`,
  languages: (count: number) => `${count} ${count === 1 ? 'language' : 'languages'}`,
  /** "Fix 1 field: first name". */
  fix: (labels: string[]) =>
    `Fix ${labels.length} ${labels.length === 1 ? 'field' : 'fields'}: ${labels.map((label) => label.toLowerCase()).join(', ')}`,
} as const;

/** The error summary's heading after a download finds issues. */
export const downloadErrorSummaryTitle = (count: number) =>
  `Fix ${count} ${count === 1 ? 'field' : 'fields'} to download your PDF`;

/** Start a new resume: how to fill it in. A guest has no profile, so the second card says so. */
export const START_SCREEN = {
  title: 'Start a new resume',
  intro: 'Choose how to fill it in. You can change anything later in the editor.',
  import: {
    title: 'Import a resume',
    body: 'Upload a PDF of your current resume. We fill in the editor for you to check.',
    action: 'Upload a PDF',
  },
  manual: {
    title: 'Fill it in yourself',
    body: 'Start from your profile and edit it section by section.',
    guestBody: 'Start from a blank resume and edit it section by section.',
    action: 'Open the editor',
  },
} as const;

/** Import your resume: one PDF, parsed into the editor. */
export const IMPORT_SCREEN = {
  back: 'Choose another way',
  title: 'Import your resume',
  intro: 'Upload a PDF. We read it and fill in the editor. Check every section before you download.',
  drop: 'Drag your resume PDF here',
  dropPhone: 'Choose your resume PDF',
  pdfOnly: 'PDF files only',
  choose: 'Choose a PDF',
  invalid: 'Invalid file type. Please upload a PDF file.',
} as const;
