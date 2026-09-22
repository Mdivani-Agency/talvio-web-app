import type { JSONContent } from '@tiptap/react';

import { persistedRowId, toBooleanPresent, toIsoDateTime } from '@lib/adapters/profile.adapter';
import { resumeFormSchema } from '@lib/schema/resume.schema';
import type { AccountDto, ResumeForm } from '@lib/types';

import { DEFAULT_ACCOUNT_DTO } from './account-defaults';

export type ResumeFieldIssue = {
  path: string;
  message: string;
};

type DatedItem = Record<string, unknown>;

function paragraphDoc(text: string): JSONContent {
  return {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  };
}

function bulletDoc(items: Array<{ text: string; mark: string }>): JSONContent {
  return {
    type: 'doc',
    content: [
      {
        type: 'bulletList',
        content: items.map(({ text, mark }) => ({
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              marks: [{ type: mark }],
              content: [{ type: 'text', text }],
            },
          ],
        })),
      },
    ],
  };
}

function withId<T extends { id?: string }>(item: T): T {
  const id = persistedRowId(item.id);
  if (!id) {
    const copy = { ...item };
    delete copy.id;
    return copy;
  }
  return { ...item, id };
}

function normalizeId(item: DatedItem) {
  if (!('id' in item)) {
    return;
  }
  const id = persistedRowId(typeof item.id === 'string' ? item.id : undefined);
  if (id) {
    item.id = id;
  } else {
    delete item.id;
  }
}

function normalizeDates(item: DatedItem) {
  for (const key of ['startDate', 'endDate'] as const) {
    if (!(key in item)) {
      continue;
    }
    const next = typeof item[key] === 'string' ? toIsoDateTime(item[key]) : undefined;
    if (next) {
      item[key] = next;
    } else {
      delete item[key];
    }
  }
  if ('isPresent' in item) {
    item.isPresent = toBooleanPresent(item.isPresent);
  }
}

function copyItem(value: unknown): DatedItem | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  return { ...(value as DatedItem) };
}

/**
 * One-time profile → resume document. Later edits stay on the document.
 * Seniority stays on the account. Dates and `isPresent` are normalized here.
 */
export function profileToResumeDocument(account: AccountDto): ResumeForm {
  const { profile } = account;
  const city = profile.city?.trim() ?? '';
  const country = profile.country?.trim() ?? '';
  const experience = (account.experience ?? []).map((item) => {
    const bullets = [
      ...(item.keyContributions ?? []).map((text) => ({ text, mark: 'keyContributions' })),
      ...(item.achievements ?? []).map((text) => ({ text, mark: 'achievements' })),
      ...(item.responsibilities ?? []).map((text) => ({ text, mark: 'responsibilities' })),
    ];
    return withId({
      company: item.company,
      jobTitle: item.jobTitle,
      startDate: toIsoDateTime(item.startDate) ?? item.startDate,
      ...(item.endDate ? { endDate: toIsoDateTime(item.endDate) ?? item.endDate } : {}),
      isPresent: toBooleanPresent(item.isPresent),
      ...(item.employmentType ? { employmentType: item.employmentType } : {}),
      ...(item.locationType ? { locationType: item.locationType } : {}),
      ...(item.achievements ? { achievements: item.achievements } : {}),
      ...(item.responsibilities ? { responsibilities: item.responsibilities } : {}),
      ...(item.keyContributions ? { keyContributions: item.keyContributions } : {}),
      ...(bullets.length ? { description: bulletDoc(bullets) } : {}),
      id: item.id,
    });
  });

  return {
    profile: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      role: profile.role,
      ...(profile.tagline ? { tagline: profile.tagline } : {}),
    },
    contacts: {
      email: profile.email,
      ...(profile.phone ? { phone: profile.phone } : {}),
      ...(profile.website ? { url: profile.website } : {}),
    },
    ...(city || country ? { location: { ...(city ? { city } : {}), ...(country ? { country } : {}) } } : {}),
    skills: (account.skills ?? []).map((skill) => withId({ name: skill.name, id: skill.id })),
    tools: (account.tools ?? []).map((tool) => withId({ name: tool.name, id: tool.id })),
    links: (account.links ?? []).map((link) => withId({ type: link.type, value: link.value, id: link.id })),
    languages: (account.languages ?? []).map((language) =>
      withId({ language: language.language, proficiency: language.proficiency, id: language.id }),
    ),
    experience,
    education: (account.education ?? []).map((item) =>
      withId({
        name: item.name,
        degreeType: item.degreeType,
        startDate: toIsoDateTime(item.startDate) ?? item.startDate,
        ...(item.endDate ? { endDate: toIsoDateTime(item.endDate) ?? item.endDate } : {}),
        isPresent: toBooleanPresent(item.isPresent),
        ...(item.additionalDetails ? { description: paragraphDoc(item.additionalDetails) } : {}),
        id: item.id,
      }),
    ),
    recommendations: (account.recommendations ?? []).map((item) =>
      withId({
        name: item.name,
        url: item.url,
        description: paragraphDoc(item.additionalDetails ?? ''),
        id: item.id,
      }),
    ),
    projects: (account.projects ?? []).map((item) =>
      withId({
        name: item.name,
        ...(item.url ? { url: item.url } : {}),
        description: paragraphDoc(item.additionalDetails ?? ''),
        id: item.id,
      }),
    ),
  };
}

/** Dates, booleans, and ids only. Rich text is left as stored. */
export function normalizeResumeDocument<T>(document: T): T {
  const root = copyItem(document);
  if (!root) {
    return document;
  }

  for (const key of ['experience', 'education'] as const) {
    if (!Array.isArray(root[key])) {
      continue;
    }
    root[key] = (root[key] as unknown[]).map((item) => {
      const copy = copyItem(item);
      if (!copy) {
        return item;
      }
      normalizeDates(copy);
      normalizeId(copy);
      return copy;
    });
  }

  for (const key of ['recommendations', 'projects', 'skills', 'tools', 'links', 'languages'] as const) {
    if (!Array.isArray(root[key])) {
      continue;
    }
    root[key] = (root[key] as unknown[]).map((item) => {
      const copy = copyItem(item);
      if (!copy) {
        return item;
      }
      normalizeId(copy);
      return copy;
    });
  }

  if (root.location && typeof root.location === 'object' && !Array.isArray(root.location)) {
    const location = root.location as { city?: unknown; country?: unknown };
    const city = typeof location.city === 'string' ? location.city : '';
    const country = typeof location.country === 'string' ? location.country : '';
    if (!city.trim() && !country.trim()) {
      delete root.location;
    }
  }

  return root as T;
}

/**
 * Dialog saves replace an item with an account-shaped object.
 * Keep the existing rich-text description and only real UUID ids.
 */
export function preserveDocumentFields<T extends { id?: string; description?: unknown }>(
  current: T | undefined,
  next: T,
): T {
  const currentCopy = { ...(current ?? {}) } as T & { id?: string };
  const nextCopy = { ...next } as T & { id?: string };
  const id = persistedRowId(next.id) ?? persistedRowId(current?.id);
  delete currentCopy.id;
  delete nextCopy.id;
  const description = current?.description;

  return {
    ...currentCopy,
    ...nextCopy,
    ...(id ? { id } : {}),
    ...(description !== undefined ? { description } : {}),
  } as T;
}

export function resumeSubmissionIssues(document: unknown): ResumeFieldIssue[] {
  const parsed = resumeFormSchema.safeParse(normalizeResumeDocument(document));
  if (parsed.success) {
    return [];
  }
  return parsed.error.issues.map((issue) => ({
    path: issue.path.map(String).join('.'),
    message: issue.message,
  }));
}

export function formatResumeFieldIssues(issues: ResumeFieldIssue[]): string {
  return issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n');
}

export const EMPTY_RESUME_DOCUMENT: ResumeForm = profileToResumeDocument(DEFAULT_ACCOUNT_DTO);
