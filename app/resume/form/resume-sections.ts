import type { ResumeFieldIssue } from '@lib/models/resume-document';
import type { ResumeForm } from '@lib/types';
import {
  RESUME_FIELD_LABELS,
  RESUME_SECTIONS,
  SECTION_SUMMARY,
  type ResumeSectionId,
} from '@/lib/resume-editor-copy';

const root = (path: string) => path.split('.')[0] ?? path;

/** The accordion section that owns a form path such as `profile.firstName` or `experience.0.startDate`. */
export function resumeSectionOf(path: string): ResumeSectionId {
  const head = root(path);
  return RESUME_SECTIONS.find((section) => (section.prefixes as readonly string[]).includes(head))?.id ?? 'about';
}

export function resumeSectionTitle(id: ResumeSectionId): string {
  return RESUME_SECTIONS.find((section) => section.id === id)?.title ?? '';
}

/** A field's name in words: "First name"; "Experience 2, Start date" for a list entry. */
export function resumeFieldLabel(path: string): string {
  const parts = path.split('.');
  const leaf = [...parts].reverse().find((part) => !/^\d+$/.test(part)) ?? path;
  const index = parts.find((part) => /^\d+$/.test(part));
  const label = RESUME_FIELD_LABELS[leaf] ?? resumeSectionTitle(resumeSectionOf(path));
  if (index !== undefined && parts.length > 2) {
    return `${resumeSectionTitle(resumeSectionOf(path))} ${Number(index) + 1}, ${label}`;
  }
  return label;
}

function skillsSummary(values: ResumeForm): string {
  const skills = values.skills ?? [];
  const groups = new Set(skills.map((skill) => skill.group?.trim()).filter(Boolean));
  return values.profile?.groupSkills && groups.size > 0
    ? SECTION_SUMMARY.groupedSkills(skills.length, groups.size)
    : SECTION_SUMMARY.skills(skills.length);
}

export type ResumeSectionState = {
  id: ResumeSectionId;
  title: string;
  state: 'done' | 'error' | 'todo';
  summary: string;
};

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
const count = (value: unknown) => (Array.isArray(value) ? value.length : 0);

function contentSummary(id: ResumeSectionId, values: ResumeForm): { summary: string; done: boolean; optional?: boolean } {
  switch (id) {
    case 'about': {
      const name = [text(values.profile?.firstName), text(values.profile?.lastName)].filter(Boolean).join(' ');
      const achievements = count(values.headlineAchievements);
      const line = [name, text(values.profile?.role), achievements ? SECTION_SUMMARY.achievements(achievements) : '']
        .filter(Boolean)
        .join(' · ');
      return { summary: line || SECTION_SUMMARY.notStarted, done: Boolean(name) };
    }
    case 'contact': {
      const line = [text(values.contacts?.email), text(values.location?.city)].filter(Boolean).join(' · ');
      return { summary: line || SECTION_SUMMARY.notStarted, done: Boolean(text(values.contacts?.email)) };
    }
    case 'highlights': {
      const parts = [
        count(values.skills) ? skillsSummary(values) : '',
        count(values.tools) ? SECTION_SUMMARY.tools(count(values.tools)) : '',
        count(values.languages) ? SECTION_SUMMARY.languages(count(values.languages)) : '',
      ].filter(Boolean);
      return { summary: parts.join(' · ') || SECTION_SUMMARY.notStarted, done: parts.length > 0 };
    }
    case 'experience': {
      const n = count(values.experience);
      return { summary: n ? SECTION_SUMMARY.roles(n) : SECTION_SUMMARY.notStarted, done: n > 0 };
    }
    case 'education': {
      const n = count(values.education);
      return { summary: n ? SECTION_SUMMARY.entries(n) : SECTION_SUMMARY.notStarted, done: n > 0 };
    }
    case 'projects': {
      const n = count(values.projects);
      return { summary: n ? SECTION_SUMMARY.projects(n) : SECTION_SUMMARY.optionalEmpty, done: n > 0, optional: true };
    }
  }
}

/**
 * Each section's mark and one-line summary. A section with issues reads "Fix 1 field: first name"; `formErrors` adds
 * the sections the form's own validation flags without a listed issue.
 */
export function resumeSectionStates(
  values: ResumeForm,
  issues: ResumeFieldIssue[] = [],
  formErrors: ReadonlySet<ResumeSectionId> = new Set(),
): ResumeSectionState[] {
  return RESUME_SECTIONS.map(({ id, title }) => {
    const sectionIssues = issues.filter((issue) => resumeSectionOf(issue.path) === id);
    if (sectionIssues.length > 0) {
      const labels = [...new Set(sectionIssues.map((issue) => resumeFieldLabel(issue.path)))];
      return { id, title, state: 'error', summary: SECTION_SUMMARY.fix(labels) };
    }
    const { summary, done } = contentSummary(id, values);
    if (formErrors.has(id)) {
      return { id, title, state: 'error', summary };
    }
    return { id, title, state: done ? 'done' : 'todo', summary };
  });
}
