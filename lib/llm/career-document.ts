import { documentToAiPayload, AI_ITEM_SECTIONS, type AiItemSection } from '@lib/ai-improve/payload';
import {
  DegreeTypeEnum,
  employmentTypeEnum,
  LanguageProficiency,
  locationTypeEnum,
} from '@lib/schema/enums';
import type { ResumeForm } from '@lib/types';

/*
 * A resume document as the LLM service's CareerDocument (MDI-221), for an improve session.
 *
 * Entries go through `documentToAiPayload`, the same account-shaped view the editor's dialogs use,
 * so bullets and details come from the rich text exactly as a dialog would show them. Every entity
 * gets a stable id: its row UUID when it has one, otherwise `resume:<section>:<index>`. The id map
 * lets an accepted change find its entry again. Text over the service's limits is cut, never sent
 * as an invalid document; unknown values are null.
 */

const SHORT = 300;
const LONG = 5_000;
const BULLETS = 30;
const ENTRIES = 50;
const BLOCKS = 100;

export type InlineText = { text: string; marks?: string[]; href?: string };
export type ContentDoc = {
  type: 'doc';
  blocks: (
    | { type: 'paragraph'; content: InlineText[] }
    | { type: 'bulletList' | 'orderedList'; items: InlineText[][] }
  )[];
};

type Nullable<T> = T | null;

export type CareerDocument = {
  person: { firstName: Nullable<string>; lastName: Nullable<string>; role: Nullable<string>; tagline: Nullable<string>; seniority: null };
  contacts: { email: Nullable<string>; phone: Nullable<string>; url: Nullable<string> };
  location: { city: Nullable<string>; country: Nullable<string> };
  experience: {
    id: string;
    company: Nullable<string>;
    jobTitle: Nullable<string>;
    employmentType: Nullable<string>;
    locationType: Nullable<string>;
    startDate: Nullable<string>;
    endDate: Nullable<string>;
    current: Nullable<boolean>;
    description: Nullable<ContentDoc>;
    achievements: string[];
    responsibilities: string[];
    keyContributions: string[];
  }[];
  education: {
    id: string;
    name: Nullable<string>;
    degreeType: Nullable<string>;
    startDate: Nullable<string>;
    endDate: Nullable<string>;
    current: Nullable<boolean>;
    description: Nullable<ContentDoc>;
  }[];
  projects: { id: string; name: Nullable<string>; url: Nullable<string>; description: Nullable<ContentDoc> }[];
  recommendations: { id: string; name: Nullable<string>; url: Nullable<string>; description: Nullable<ContentDoc> }[];
  skills: { id: string; name: string }[];
  tools: { id: string; name: string }[];
  links: { id: string; type: Nullable<string>; value: string }[];
  languages: { id: string; language: string; proficiency: Nullable<string> }[];
};

export type EntitySection = AiItemSection | 'skills' | 'tools' | 'links' | 'languages';

/** Where each entity id sits in the resume, by section and position. */
export type EntityIndex = Record<string, { section: EntitySection; index: number }>;

export type ResumeCareerDocument = { document: CareerDocument; entities: EntityIndex };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Item = Record<string, unknown>;

function cut(value: unknown, max: number): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function lines(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => cut(entry, LONG))
    .filter((entry): entry is string => entry !== null)
    .slice(0, BULLETS);
}

function oneOf(options: readonly string[], value: unknown): string | null {
  return typeof value === 'string' && options.includes(value) ? value : null;
}

/** The form's ISO date at month precision (the editor picks months), or null. */
export function isoToPartialDate(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const match = value.match(/^(\d{4})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}` : null;
}

/** Plain details, one paragraph per line, as a content document; null when empty. */
export function detailsToContent(details: unknown): ContentDoc | null {
  if (typeof details !== 'string') {
    return null;
  }
  const blocks = details
    .split('\n')
    .map((line) => line.trim().slice(0, LONG))
    .filter(Boolean)
    .slice(0, BLOCKS)
    .map((text) => ({ type: 'paragraph' as const, content: [{ text }] }));
  return blocks.length ? { type: 'doc', blocks } : null;
}

/** A content document as plain details, one line per paragraph or list item. */
export function contentToDetails(doc: unknown): string {
  if (!doc || typeof doc !== 'object' || !Array.isArray((doc as ContentDoc).blocks)) {
    return '';
  }
  const join = (nodes: unknown) => (Array.isArray(nodes) ? nodes.map((node) => (node as InlineText)?.text ?? '').join('') : '');
  return (doc as ContentDoc).blocks
    .flatMap((block) => ('content' in block ? [join(block.content)] : Array.isArray(block.items) ? block.items.map(join) : []))
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

function period(item: Item) {
  const present = item.isPresent === true;
  const endDate = present ? null : isoToPartialDate(item.endDate);
  return {
    startDate: isoToPartialDate(item.startDate),
    endDate,
    current: present ? true : endDate ? false : null,
  };
}

/** The resume as a CareerDocument with stable entity ids, and where each id sits in the resume. */
export function resumeToCareerDocument(resume: ResumeForm): ResumeCareerDocument {
  const payload = documentToAiPayload(resume) as unknown as Record<string, unknown>;
  const profile = (payload.profile ?? {}) as Item;
  const entities: EntityIndex = {};
  const taken = new Set<string>();

  const idFor = (section: EntitySection, index: number, item: Item): string => {
    const own = typeof item.id === 'string' && UUID.test(item.id) && !taken.has(item.id) ? item.id : null;
    const id = own ?? `resume:${section}:${index}`;
    taken.add(id);
    entities[id] = { section, index };
    return id;
  };
  const itemsOf = (section: EntitySection): Item[] => {
    const value = payload[section];
    return Array.isArray(value) ? (value as Item[]).slice(0, ENTRIES) : [];
  };

  const sections = Object.fromEntries(AI_ITEM_SECTIONS.map((section) => [section, itemsOf(section)])) as Record<AiItemSection, Item[]>;

  const document: CareerDocument = {
    person: {
      firstName: cut(profile.firstName, SHORT),
      lastName: cut(profile.lastName, SHORT),
      role: cut(profile.role, SHORT),
      tagline: cut(profile.tagline, LONG),
      seniority: null,
    },
    contacts: {
      email: cut(profile.email, SHORT),
      phone: cut(profile.phone, SHORT),
      url: cut(profile.website, SHORT),
    },
    location: { city: cut(profile.city, SHORT), country: cut(profile.country, SHORT) },
    experience: sections.experience.map((item, index) => ({
      id: idFor('experience', index, item),
      company: cut(item.company, SHORT),
      jobTitle: cut(item.jobTitle, SHORT),
      employmentType: oneOf(employmentTypeEnum.options, item.employmentType),
      locationType: oneOf(locationTypeEnum.options, item.locationType),
      ...period(item),
      description: detailsToContent(item.additionalDetails),
      achievements: lines(item.achievements),
      responsibilities: lines(item.responsibilities),
      keyContributions: lines(item.keyContributions),
    })),
    education: sections.education.map((item, index) => ({
      id: idFor('education', index, item),
      name: cut(item.name, SHORT),
      degreeType: oneOf(DegreeTypeEnum.options, item.degreeType),
      ...period(item),
      description: detailsToContent(item.additionalDetails),
    })),
    projects: sections.projects.map((item, index) => ({
      id: idFor('projects', index, item),
      name: cut(item.name, SHORT),
      url: cut(item.url, SHORT),
      description: detailsToContent(item.additionalDetails),
    })),
    recommendations: sections.recommendations.map((item, index) => ({
      id: idFor('recommendations', index, item),
      name: cut(item.name, SHORT),
      url: cut(item.url, SHORT),
      description: detailsToContent(item.additionalDetails),
    })),
    skills: [],
    tools: [],
    links: [],
    languages: [],
  };

  itemsOf('skills').forEach((item, index) => {
    const name = cut(item.name, SHORT);
    if (name) {
      document.skills.push({ id: idFor('skills', index, item), name });
    }
  });
  itemsOf('tools').forEach((item, index) => {
    const name = cut(item.name, SHORT);
    if (name) {
      document.tools.push({ id: idFor('tools', index, item), name });
    }
  });
  itemsOf('links').forEach((item, index) => {
    const value = cut(item.value, SHORT);
    if (value) {
      document.links.push({ id: idFor('links', index, item), type: cut(item.type, SHORT), value });
    }
  });
  itemsOf('languages').forEach((item, index) => {
    const language = cut(item.language, SHORT);
    if (language) {
      document.languages.push({
        id: idFor('languages', index, item),
        language,
        proficiency: oneOf(LanguageProficiency.options, item.proficiency),
      });
    }
  });

  return { document, entities };
}
