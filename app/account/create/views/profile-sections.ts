import type { AccountDto } from '@lib/types';
import {
  CONTACT_FIELDS,
  EDUCATION_FIELDS,
  EXPERIENCE_FIELDS,
  HIGHLIGHT_FIELDS,
  HEADLINE_ACHIEVEMENT_COPY,
  IMPORT_REVIEW,
  PROFILE_FIELDS,
  PROFILE_SECTIONS,
  PROJECT_FIELDS,
  SECTION_OPTIONAL_NOTE,
  sectionFixNote,
} from '@/lib/onboarding-copy';

/** The sections of the profile form, in page order. Each id is also the anchor of its card. */
export const PROFILE_SECTION_IDS = ['about', 'contact', 'highlights', 'experience', 'education', 'projects'] as const;
export type ProfileSectionId = (typeof PROFILE_SECTION_IDS)[number];

const CONTACT_KEYS = new Set(['email', 'phone', 'website', 'city', 'country']);

/** Field names come from TanStack Form, such as `profile.email` or `skills[2].name`. */
function rootOf(path: string): string {
  return path.split(/[.[]/)[0] ?? path;
}

export function sectionOf(path: string): ProfileSectionId {
  const root = rootOf(path);
  if (root === 'profile') {
    const key = path.split('.')[1] ?? '';
    return CONTACT_KEYS.has(key) ? 'contact' : 'about';
  }
  if (root === 'links' || root === 'skills' || root === 'tools' || root === 'languages') return 'highlights';
  if (root === 'experience' || root === 'education' || root === 'projects') return root;
  return 'about';
}

const PROFILE_LABELS: Record<string, string> = {
  firstName: PROFILE_FIELDS.firstName.label,
  lastName: PROFILE_FIELDS.lastName.label,
  role: PROFILE_FIELDS.role.label,
  tagline: PROFILE_FIELDS.summary.label,
  email: CONTACT_FIELDS.email.label,
  phone: CONTACT_FIELDS.phone.label,
  website: CONTACT_FIELDS.website.label,
  city: CONTACT_FIELDS.city.label,
  country: CONTACT_FIELDS.country.label,
};

const LIST_LABELS: Record<string, string> = {
  links: HIGHLIGHT_FIELDS.links.label,
  skills: HIGHLIGHT_FIELDS.skills.label,
  headlineAchievements: HEADLINE_ACHIEVEMENT_COPY.label,
  tools: HIGHLIGHT_FIELDS.tools.label,
  experience: PROFILE_SECTIONS.experience.title,
  education: PROFILE_SECTIONS.education.title,
  projects: PROFILE_SECTIONS.projects.title,
};

const ITEM_LABELS: Record<string, Record<string, string>> = {
  languages: { language: HIGHLIGHT_FIELDS.language.label, proficiency: HIGHLIGHT_FIELDS.proficiency.label },
  experience: {
    company: EXPERIENCE_FIELDS.company.label,
    jobTitle: EXPERIENCE_FIELDS.jobTitle.label,
    employmentType: EXPERIENCE_FIELDS.employmentType.label,
    locationType: EXPERIENCE_FIELDS.locationType.label,
  },
  education: { name: EDUCATION_FIELDS.name.label, degreeType: EDUCATION_FIELDS.degreeType.label },
  projects: { name: PROJECT_FIELDS.name.label, url: PROJECT_FIELDS.url.label },
  headlineAchievements: { value: 'Value', label: 'What it measures' },
};

/** The visible label of the field an error belongs to, for the error summary. */
export function fieldLabelOf(path: string): string {
  const root = rootOf(path);
  if (root === 'profile') return PROFILE_LABELS[path.split('.')[1] ?? ''] ?? PROFILE_SECTIONS.about.title;
  const leaf = path.match(/\]\.(\w+)$/)?.[1];
  if (leaf && ITEM_LABELS[root]?.[leaf]) return ITEM_LABELS[root][leaf];
  if (root === 'languages') return 'Languages';
  return LIST_LABELS[root] ?? PROFILE_SECTIONS[sectionOf(path)].title;
}

export type FormFieldError = { path: string; label: string; message: string; section: ProfileSectionId };

type FieldMetaLike = Record<string, { errors?: unknown[] } | undefined>;

function messageOf(error: unknown): string | undefined {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error && error.message) return String(error.message);
  if (Array.isArray(error)) return messageOf(error[0]);
  return undefined;
}

/** Every field with an error, one entry per field, in page order. */
export function collectFieldErrors(fieldMeta: FieldMetaLike): FormFieldError[] {
  const errors: FormFieldError[] = [];
  for (const [path, meta] of Object.entries(fieldMeta)) {
    const message = messageOf(meta?.errors?.[0]);
    if (!message) continue;
    errors.push({ path, label: fieldLabelOf(path), message, section: sectionOf(path) });
  }
  return errors
    .map((error, index) => ({ error, index }))
    .sort(
      (a, b) =>
        PROFILE_SECTION_IDS.indexOf(a.error.section) - PROFILE_SECTION_IDS.indexOf(b.error.section) ||
        a.index - b.index,
    )
    .map(({ error }) => error);
}

export type SectionStatus = {
  id: ProfileSectionId;
  title: string;
  state: 'done' | 'error' | 'todo' | 'check';
  note: string;
};

const filled = (value: string | undefined | null) => Boolean(value && value.trim());

function hasContent(id: ProfileSectionId, values: Partial<AccountDto>): boolean {
  const profile = values.profile;
  switch (id) {
    case 'about':
      return filled(profile?.firstName) && filled(profile?.lastName) && filled(profile?.role);
    case 'contact':
      return filled(profile?.email);
    case 'highlights':
      return Boolean(
        values.skills?.length || values.tools?.length || values.languages?.length || values.links?.length,
      );
    default:
      return Boolean(values[id]?.length);
  }
}

/** The side list: a fix mark where the last save found errors, a done mark where the section has content. */
/**
 * Each section's mark and note in the side list. Errors come first; after an import, the sections the check panel
 * lists (`check`) show "Check" until the profile is saved (MDI-674).
 */
export function sectionStatuses(
  values: Partial<AccountDto>,
  errors: FormFieldError[],
  check: readonly ProfileSectionId[] = [],
): SectionStatus[] {
  return PROFILE_SECTION_IDS.map((id) => {
    const title = PROFILE_SECTIONS[id].title;
    const errorCount = errors.filter((error) => error.section === id).length;
    if (errorCount > 0) return { id, title, state: 'error', note: sectionFixNote(errorCount) };
    if (check.includes(id)) return { id, title, state: 'check', note: IMPORT_REVIEW.checkNote };

    const done = hasContent(id, values);
    const count = id === 'experience' || id === 'education' || id === 'projects' ? (values[id]?.length ?? 0) : 0;
    const note = count > 0 ? String(count) : id === 'projects' ? SECTION_OPTIONAL_NOTE : '';
    return { id, title, state: done ? 'done' : 'todo', note };
  });
}

/**
 * Where an import's check item belongs in the form (MDI-674). `ImportReview` names sections by label: "Profile"
 * covers the person, contacts and location, so it points at About you; skills, tools, links and languages are in
 * Highlights. Recommendations have no place in the form.
 */
export function sectionForImportReview(label: string): ProfileSectionId | null {
  switch (label) {
    case 'Profile':
      return 'about';
    case 'Experience':
      return 'experience';
    case 'Education':
      return 'education';
    case 'Projects':
      return 'projects';
    case 'Skills':
    case 'Tools':
    case 'Links':
    case 'Languages':
      return 'highlights';
    default:
      return null;
  }
}
