import { resumeItemToAccountDialog, preserveDocumentFields } from '@lib/models/resume-document';
import type { AccountDto, DeepPartial, ResumeForm } from '@lib/types';

import { mergeAccountProposal } from './proposal';

/** Sections whose entries the AI may rewrite. Entries are matched by position. */
export const AI_ITEM_SECTIONS = ['experience', 'education', 'projects', 'recommendations'] as const;
export type AiItemSection = (typeof AI_ITEM_SECTIONS)[number];

/** Text fields the proposal may change on an entry. Names, dates and links are never taken from it. */
const CONTENT_FIELDS: Record<AiItemSection, readonly string[]> = {
  experience: ['additionalDetails', 'achievements', 'responsibilities', 'keyContributions'],
  education: ['additionalDetails'],
  projects: ['additionalDetails'],
  recommendations: ['additionalDetails'],
};

type Item = Record<string, unknown>;

export type AiFieldChange = {
  section: 'profile' | AiItemSection;
  /** Entry position in the section; absent for the profile. */
  index?: number;
  /** Company, school or project name, for the review heading. */
  title?: string;
  field: string;
  before: string;
  after: string;
};

export type AiProposalResult = {
  resume: ResumeForm;
  changes: AiFieldChange[];
  /** Sections where the proposal added or removed entries; they are kept as they were (D13). */
  keptSections: AiItemSection[];
};

function itemsOf(resume: ResumeForm, section: AiItemSection): Item[] {
  const value = (resume as Record<string, unknown>)[section];
  return Array.isArray(value) ? (value as Item[]) : [];
}

/** Account-shaped item for the model: rich text becomes `additionalDetails` and bullet lists. */
function dialogItem(item: Item): Item {
  const dialog = resumeItemToAccountDialog(item) as Item;
  delete dialog.description;
  return dialog;
}

/**
 * The resume document as the account-shaped JSON the `qa` and `account` routes expect.
 * Contacts, location, skills, tools, links and languages are copied; entries go through
 * `resumeItemToAccountDialog` so bullets and details come from the rich text.
 */
export function documentToAiPayload(resume: ResumeForm): AccountDto {
  const payload: Record<string, unknown> = {
    profile: {
      firstName: resume.profile?.firstName ?? '',
      lastName: resume.profile?.lastName ?? '',
      role: resume.profile?.role ?? '',
      email: resume.contacts?.email ?? '',
      ...(resume.profile?.tagline ? { tagline: resume.profile.tagline } : {}),
      ...(resume.contacts?.phone ? { phone: resume.contacts.phone } : {}),
      ...(resume.contacts?.url ? { website: resume.contacts.url } : {}),
      ...(resume.location?.city ? { city: resume.location.city } : {}),
      ...(resume.location?.country ? { country: resume.location.country } : {}),
    },
    skills: resume.skills ?? [],
    tools: resume.tools ?? [],
    links: resume.links ?? [],
    languages: resume.languages ?? [],
  };
  for (const section of AI_ITEM_SECTIONS) {
    payload[section] = itemsOf(resume, section).map(dialogItem);
  }
  return payload as AccountDto;
}

function asText(value: unknown): string {
  if (Array.isArray(value)) {
    return value.filter((entry) => typeof entry === 'string' && entry.trim()).join('\n');
  }
  return typeof value === 'string' ? value : '';
}

function itemTitle(section: AiItemSection, item: Item): string | undefined {
  const value = section === 'experience' ? item.company : item.name;
  return typeof value === 'string' && value ? value : undefined;
}

/**
 * Writes an accepted proposal into the document.
 * - Only the tagline and entry text fields (details and experience bullets) are taken.
 * - A section whose proposed entry count differs from the document is kept and reported.
 * - A changed entry goes through `preserveDocumentFields`, so its id survives and its rich text
 *   is rebuilt; an unchanged entry is the stored object, so its rich text stays byte-identical.
 */
export function applyAiProposal(
  resume: ResumeForm,
  payload: AccountDto,
  proposal: DeepPartial<AccountDto>,
): AiProposalResult {
  const merged = mergeAccountProposal(payload, proposal) as unknown as Record<string, unknown>;
  const changes: AiFieldChange[] = [];
  const keptSections: AiItemSection[] = [];
  let next: ResumeForm = resume;

  const beforeTagline = payload.profile.tagline ?? '';
  const afterTagline = (merged.profile as AccountDto['profile']).tagline ?? '';
  if (afterTagline && afterTagline !== beforeTagline) {
    changes.push({ section: 'profile', field: 'tagline', before: beforeTagline, after: afterTagline });
    next = { ...next, profile: { ...next.profile, tagline: afterTagline } };
  }

  for (const section of AI_ITEM_SECTIONS) {
    const proposed = (proposal as Record<string, unknown>)[section];
    if (!Array.isArray(proposed)) {
      continue;
    }
    const sourceItems = (payload as unknown as Record<string, Item[]>)[section] ?? [];
    if (proposed.length !== sourceItems.length) {
      keptSections.push(section);
      continue;
    }

    const stored = itemsOf(resume, section);
    let sectionChanged = false;
    const updated = stored.map((current, index) => {
      const source = sourceItems[index] ?? {};
      const candidate = (proposed[index] ?? {}) as Item;
      const patch: Item = {};
      for (const field of CONTENT_FIELDS[section]) {
        if (!(field in candidate)) {
          continue;
        }
        const before = asText(source[field]);
        const after = asText(candidate[field]);
        if (before === after) {
          continue;
        }
        patch[field] = candidate[field];
        changes.push({ section, index, title: itemTitle(section, current), field, before, after });
      }
      if (!Object.keys(patch).length) {
        return current;
      }
      sectionChanged = true;
      return preserveDocumentFields(current, { ...source, ...patch, id: current.id as string | undefined });
    });

    if (sectionChanged) {
      next = { ...next, [section]: updated } as ResumeForm;
    }
  }

  return { resume: next, changes, keptSections };
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0));
    return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

/** Identifies the document a question set or proposal was made for (FNV-1a over canonical JSON). */
export function documentHash(resume: ResumeForm): string {
  const text = stableStringify(resume);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
