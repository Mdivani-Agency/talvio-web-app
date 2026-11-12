import { z } from 'zod';

import { documentToAiPayload } from '@lib/ai-improve/payload';
import { preserveDocumentFields } from '@lib/models/resume-document';
import type { ResumeForm } from '@lib/types';

import { resumeToCareerDocument, type EntitySection } from './career-document';
import type { ResultEnvelope } from './contract';
import { reviewServiceProposal, type ServiceProposal, type ServiceReview } from './improve-proposal';

/*
 * Job-post tailoring (MDI-221): the tailor_resume result, and the JOB_SPECIFIC resume the user
 * creates from it. The service composes the resume as changes to the source plus omissions; the web
 * applies them to the source document so the user's choices hold: a change that needs confirmation
 * applies only once confirmed, and an omission the user keeps leaves the original content in. The
 * source order of entries is kept. Requirements the candidate's evidence does not support are shown
 * as gaps, never filled in.
 */

export const JOB_DESCRIPTION_MAX = 5_000;

const requirement = z.looseObject({ id: z.string(), text: z.string(), kind: z.string().catch('required') });
const coverage = z.looseObject({
  requirementId: z.string(),
  status: z.string(),
  note: z.string().nullable().catch(null),
});
const omission = z.looseObject({
  id: z.string(),
  section: z.string(),
  entityId: z.string().nullable(),
  field: z.string().nullable(),
  originalValue: z.unknown(),
  reason: z.string().catch(''),
});

const tailorResultSchema = z.looseObject({
  proposal: z.looseObject({
    proposalId: z.string(),
    summary: z.string().catch(''),
    changes: z.array(z.looseObject({ type: z.string(), id: z.string() })),
    omissions: z.array(omission).catch([]),
  }),
  requirements: z.array(requirement).catch([]),
  coverage: z.array(coverage).catch([]),
  unsupportedRequirementIds: z.array(z.string()).catch([]),
});

export type TailorResult = z.infer<typeof tailorResultSchema>;

export function tailorResultFromEnvelope(envelope: ResultEnvelope): TailorResult | null {
  const parsed = tailorResultSchema.safeParse(envelope.result);
  return parsed.success ? parsed.data : null;
}

export type RequirementView = {
  id: string;
  text: string;
  kind: 'required' | 'preferred';
  status: 'supported' | 'partial' | 'missing';
  note: string | null;
};

export type OmissionView = {
  id: string;
  /** What is left out, in words. */
  label: string;
  reason: string;
};

export type TailorReview = ServiceReview & {
  requirements: RequirementView[];
  omissions: OmissionView[];
};

type Item = Record<string, unknown>;

const SECTION_LABEL: Record<string, string> = {
  person: 'Profile',
  experience: 'Experience',
  education: 'Education',
  projects: 'Projects',
  recommendations: 'Recommendations',
  skills: 'Skills',
  tools: 'Tools',
  links: 'Links',
  languages: 'Languages',
};

const FIELD_LABEL: Record<string, string> = {
  tagline: 'summary',
  description: 'details',
  achievements: 'achievements',
  responsibilities: 'responsibilities',
  keyContributions: 'key contributions',
};

function entryName(section: string, item: Item | undefined): string {
  const value = section === 'experience' ? item?.company : section === 'languages' ? item?.language : section === 'links' ? item?.value : item?.name;
  return typeof value === 'string' && value ? value : 'an entry';
}

function requirementsView(result: TailorResult): RequirementView[] {
  const unsupported = new Set(result.unsupportedRequirementIds);
  return result.requirements.map((item) => {
    const covered = result.coverage.find((entry) => entry.requirementId === item.id);
    const status = unsupported.has(item.id)
      ? 'missing'
      : covered?.status === 'supported' || covered?.status === 'partial'
        ? covered.status
        : 'missing';
    return {
      id: item.id,
      text: item.text,
      kind: item.kind === 'preferred' ? 'preferred' : 'required',
      status,
      note: covered?.note ?? null,
    };
  });
}

/**
 * The tailored resume from the source document: confirmed changes applied, then every omission the
 * user did not keep. An omission that no longer finds its entry is ignored.
 */
export function reviewTailoring(
  source: ResumeForm,
  result: TailorResult,
  confirmed: ReadonlySet<string> = new Set(),
  kept: ReadonlySet<string> = new Set(),
): TailorReview {
  const review = reviewServiceProposal(source, result.proposal as unknown as ServiceProposal, confirmed);
  const { entities } = resumeToCareerDocument(source);
  const payload = documentToAiPayload(source) as unknown as Record<string, Item[]>;
  const omissions: OmissionView[] = [];
  let next = review.resume as unknown as Record<string, unknown>;
  const removed: Record<string, Set<number>> = {};
  const cleared = new Map<string, Item>();

  for (const item of result.proposal.omissions) {
    const at = item.entityId ? entities[item.entityId] : undefined;
    if (item.section === 'person' && item.field === 'tagline') {
      omissions.push({ id: item.id, label: 'Profile summary', reason: item.reason });
      if (!kept.has(item.id)) {
        next = { ...next, profile: { ...(next.profile as Item), tagline: '' } };
      }
      continue;
    }
    if (!at || at.section !== item.section) {
      continue;
    }
    const name = entryName(at.section, payload[at.section]?.[at.index]);
    if (item.field === null) {
      omissions.push({ id: item.id, label: `${SECTION_LABEL[at.section] ?? at.section}: ${name}`, reason: item.reason });
      if (!kept.has(item.id)) {
        (removed[at.section] ??= new Set()).add(at.index);
      }
      continue;
    }
    if (!FIELD_LABEL[item.field] || !['experience', 'education', 'projects', 'recommendations'].includes(at.section)) {
      continue;
    }
    omissions.push({
      id: item.id,
      label: `${SECTION_LABEL[at.section]}: ${name}, ${FIELD_LABEL[item.field]}`,
      reason: item.reason,
    });
    if (!kept.has(item.id)) {
      const key = `${at.section}:${at.index}`;
      const formField = item.field === 'description' ? 'additionalDetails' : item.field;
      const dropped = Array.isArray(item.originalValue) ? new Set(item.originalValue as string[]) : null;
      cleared.set(key, { ...cleared.get(key), [formField]: dropped ?? 'all' });
    }
  }

  if (cleared.size) {
    const current = documentToAiPayload(next as unknown as ResumeForm) as unknown as Record<string, Item[]>;
    for (const [key, fields] of cleared) {
      const [section, position] = key.split(':') as [EntitySection, string];
      const index = Number(position);
      const items = [...((next[section] as Item[] | undefined) ?? [])];
      const dialog = current[section]?.[index];
      if (!items[index] || !dialog) {
        continue;
      }
      const patch: Item = {};
      for (const [field, drop] of Object.entries(fields)) {
        if (field === 'additionalDetails') {
          patch.additionalDetails = '';
        } else {
          const values = Array.isArray(dialog[field]) ? (dialog[field] as string[]) : [];
          patch[field] = drop === 'all' ? [] : values.filter((value) => !(drop as Set<string>).has(value));
        }
      }
      items[index] = preserveDocumentFields(items[index] as Item, { ...dialog, ...patch, id: items[index]!.id as string | undefined });
      next = { ...next, [section]: items };
    }
  }

  for (const [section, indexes] of Object.entries(removed)) {
    const items = (next[section] as Item[] | undefined) ?? [];
    next = { ...next, [section]: items.filter((_, index) => !indexes.has(index)) };
  }

  return {
    ...review,
    resume: next as unknown as ResumeForm,
    requirements: requirementsView(result),
    omissions,
  };
}
