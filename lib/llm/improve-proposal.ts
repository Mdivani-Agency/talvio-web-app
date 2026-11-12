import { z } from 'zod';

import {
  AI_ITEM_SECTIONS,
  documentToAiPayload,
  type AiFieldChange,
  type AiItemSection,
  type AiProposalResult,
} from '@lib/ai-improve/payload';
import { preserveDocumentFields } from '@lib/models/resume-document';
import { LanguageProficiency } from '@lib/schema/enums';
import type { ResumeForm } from '@lib/types';

import { contentToDetails, resumeToCareerDocument, type CareerDocument } from './career-document';
import type { ResultEnvelope } from './contract';

/*
 * An improve_resume proposal (MDI-221) reviewed in the editor. The service proposes changed fields
 * only, each naming one entity and field with its original value as a precondition. A change whose
 * original no longer matches the document is dropped, never applied over newer text. A change that
 * needs confirmation (a new fact from the answers, or an added skill, tool, language or link) is
 * applied only after the user confirms its claims. Saving to the database is MDI-222; Accept writes
 * into the editor like the legacy flow.
 */

const claim = z.looseObject({ id: z.string(), text: z.string() });
const confirmation = z.looseObject({ required: z.boolean(), claims: z.array(claim) });
const changeBase = {
  id: z.string(),
  reason: z.string().catch(''),
  confirmation: confirmation.catch({ required: true, claims: [] }),
};

const fieldChange = z.looseObject({
  type: z.literal('field'),
  target: z.looseObject({
    section: z.string(),
    entityId: z.string().nullable(),
    field: z.string(),
  }),
  originalValue: z.unknown(),
  proposedValue: z.unknown(),
  ...changeBase,
});

const entityAddition = z.looseObject({
  type: z.literal('add_entity'),
  addition: z.looseObject({ section: z.string(), entity: z.looseObject({}) }),
  ...changeBase,
});

const proposalSchema = z.looseObject({
  proposalId: z.string(),
  summary: z.string().catch(''),
  changes: z.array(z.union([fieldChange, entityAddition, z.looseObject({ type: z.string(), id: z.string() })])),
});

export const improveResultSchema = z.looseObject({ proposal: proposalSchema });

export type ServiceProposal = z.infer<typeof proposalSchema>;

/** The proposal from an improve job's result envelope, or null when it is not one. */
export function proposalFromEnvelope(envelope: ResultEnvelope): ServiceProposal | null {
  const parsed = improveResultSchema.safeParse(envelope.result);
  return parsed.success ? parsed.data.proposal : null;
}

type Item = Record<string, unknown>;
type AddSection = 'skills' | 'tools' | 'languages' | 'links';

const ITEM_FIELDS: Record<AiItemSection, readonly string[]> = {
  experience: ['description', 'achievements', 'responsibilities', 'keyContributions'],
  education: ['description'],
  projects: ['description'],
  recommendations: ['description'],
};

function stable(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stable).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Item)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0));
    return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${stable(entry)}`).join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

function asText(field: string, value: unknown): string {
  if (field === 'description') {
    return contentToDetails(value);
  }
  if (Array.isArray(value)) {
    return value.filter((entry) => typeof entry === 'string' && entry.trim()).join('\n');
  }
  return typeof value === 'string' ? value : '';
}

/** The value a form field takes from a proposed value: details text, a list, or a string. */
function formValue(field: string, value: unknown): unknown {
  if (field === 'description') {
    return contentToDetails(value);
  }
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string' && Boolean(entry.trim()));
  }
  return typeof value === 'string' ? value : '';
}

function itemTitle(section: AiItemSection, item: Item | undefined): string | undefined {
  const value = section === 'experience' ? item?.company : item?.name;
  return typeof value === 'string' && value ? value : undefined;
}

function addedText(section: AddSection, entity: Item): string | null {
  switch (section) {
    case 'skills':
    case 'tools':
      return typeof entity.name === 'string' && entity.name.trim() ? entity.name.trim() : null;
    case 'languages': {
      const language = typeof entity.language === 'string' ? entity.language.trim() : '';
      const proficiency = LanguageProficiency.safeParse(entity.proficiency);
      // The form needs a proficiency; the web does not pick one for the user.
      return language && proficiency.success ? `${language} (${proficiency.data})` : null;
    }
    case 'links': {
      const value = typeof entity.value === 'string' ? entity.value.trim() : '';
      const type = typeof entity.type === 'string' ? entity.type.trim() : '';
      return value && type ? `${type}: ${value}` : null;
    }
  }
}

function addedItem(section: AddSection, entity: Item): Item {
  switch (section) {
    case 'skills':
    case 'tools':
      return { name: String(entity.name).trim() };
    case 'languages':
      return { language: String(entity.language).trim(), proficiency: entity.proficiency };
    case 'links':
      return { type: String(entity.type).trim(), value: String(entity.value).trim() };
  }
}

function alreadyThere(section: AddSection, existing: Item[], entity: Item): boolean {
  const key = (item: Item) => {
    const value = section === 'languages' ? item.language : section === 'links' ? item.value : item.name;
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
  };
  const wanted = key(entity);
  return existing.some((item) => key(item) === wanted);
}

export type ServiceReview = AiProposalResult & {
  proposalId: string;
  summary: string;
  /** Changes left out because the document no longer matched them or the form cannot hold them. */
  skipped: number;
};

/**
 * The proposal as reviewable changes, and the resume with every change applied that needs no
 * confirmation or whose claims are in `confirmed`.
 */
export function reviewServiceProposal(
  resume: ResumeForm,
  proposal: ServiceProposal,
  confirmed: ReadonlySet<string> = new Set(),
): ServiceReview {
  const { document, entities } = resumeToCareerDocument(resume);
  const payload = documentToAiPayload(resume) as unknown as Record<string, Item[]> & { profile: Item };
  const changes: AiFieldChange[] = [];
  const patches = new Map<string, Item>();
  const profilePatch: Item = {};
  const additions: Record<AddSection, Item[]> = { skills: [], tools: [], languages: [], links: [] };
  let skipped = 0;

  for (const raw of proposal.changes) {
    const required = 'confirmation' in raw ? Boolean((raw.confirmation as z.infer<typeof confirmation>).required) : true;
    const claims = 'confirmation' in raw ? (raw.confirmation as z.infer<typeof confirmation>).claims.map((item) => item.text) : [];
    const applies = !required || confirmed.has(raw.id);
    const common = {
      id: raw.id,
      reason: typeof raw.reason === 'string' ? raw.reason : '',
      claims,
      needsConfirmation: required,
    };

    const field = fieldChange.safeParse(raw);
    if (field.success) {
      const { section, entityId, field: name } = field.data.target;
      if (section === 'person' && entityId === null && (name === 'role' || name === 'tagline')) {
        const current = document.person[name];
        if (stable(current) !== stable(field.data.originalValue)) {
          skipped += 1;
          continue;
        }
        const after = asText(name, field.data.proposedValue);
        changes.push({ ...common, section: 'profile', field: name, before: asText(name, current), after });
        if (applies) {
          profilePatch[name] = after;
        }
        continue;
      }
      const at = entityId ? entities[entityId] : undefined;
      const itemSection = at?.section as AiItemSection | undefined;
      if (!at || at.section !== section || !itemSection || !ITEM_FIELDS[itemSection]?.includes(name)) {
        skipped += 1;
        continue;
      }
      const entry = (document[itemSection] as Item[])[at.index];
      if (!entry || stable(entry[name]) !== stable(field.data.originalValue)) {
        skipped += 1;
        continue;
      }
      const formField = name === 'description' ? 'additionalDetails' : name;
      changes.push({
        ...common,
        section: itemSection,
        index: at.index,
        title: itemTitle(itemSection, payload[itemSection]?.[at.index]),
        field: formField,
        before: asText(name, entry[name]),
        after: asText(name, field.data.proposedValue),
      });
      if (applies) {
        const key = `${itemSection}:${at.index}`;
        patches.set(key, { ...patches.get(key), [formField]: formValue(name, field.data.proposedValue) });
      }
      continue;
    }

    const addition = entityAddition.safeParse(raw);
    if (addition.success) {
      const section = addition.data.addition.section as AddSection;
      const entity = addition.data.addition.entity as Item;
      const text = section in additions ? addedText(section, entity) : null;
      const existing = (payload[section] ?? []) as Item[];
      if (!text || alreadyThere(section, [...existing, ...additions[section]], entity)) {
        skipped += 1;
        continue;
      }
      changes.push({ ...common, section, field: 'add', before: '', after: text });
      if (applies) {
        additions[section].push(addedItem(section, entity));
      }
      continue;
    }

    skipped += 1;
  }

  let next: ResumeForm = resume;
  if (Object.keys(profilePatch).length) {
    next = { ...next, profile: { ...next.profile, ...profilePatch } };
  }
  for (const section of AI_ITEM_SECTIONS) {
    const stored = ((resume as unknown as Record<string, Item[] | undefined>)[section] ?? []) as Item[];
    let changed = false;
    const updated = stored.map((current, index) => {
      const patch = patches.get(`${section}:${index}`);
      if (!patch) {
        return current;
      }
      changed = true;
      const source = payload[section]?.[index] ?? {};
      return preserveDocumentFields(current, { ...source, ...patch, id: current.id as string | undefined });
    });
    if (changed) {
      next = { ...next, [section]: updated } as ResumeForm;
    }
  }
  for (const section of Object.keys(additions) as AddSection[]) {
    if (additions[section].length) {
      const current = ((next as unknown as Record<string, Item[] | undefined>)[section] ?? []) as Item[];
      next = { ...next, [section]: [...current, ...additions[section]] } as ResumeForm;
    }
  }

  return {
    resume: next,
    changes,
    keptSections: [],
    proposalId: proposal.proposalId,
    summary: proposal.summary,
    skipped,
  };
}

export type { CareerDocument };
