import type { Job_ApplicationsInsertInput, Job_ApplicationsUpdateInput, ListApplicationFragment } from '@/lib/graphql/generated';
import {
  applicationLabelSchema,
  applicationLinkSchema,
  applicationStageSchema,
  type AddApplicationFormValues,
  type ApplicationLabel,
  type ApplicationLink,
  type JobApplication,
} from '@lib/schema/application.schema';

import { decodeGraphqlJson } from './resume.adapter';

/** The board loads every card, page by page; 100 is the schema's `max_rows`. */
export const APPLICATION_PAGE_SIZE = 100;

/** The name the Add dialog gives the job post link. */
export const JOB_POST_LINK_NAME = 'Job post';

export type ApplicationRow = ListApplicationFragment;

/** Keeps the valid items of a JSON array column; the database already checks them, so this only guards bad data. */
function parseList<T>(value: unknown, parse: (item: unknown) => T | null): T[] {
  const decoded = decodeGraphqlJson(value);
  if (!Array.isArray(decoded)) {
    return [];
  }
  return decoded.map(parse).filter((item): item is T => item !== null);
}

function parseLabel(item: unknown): ApplicationLabel | null {
  const parsed = applicationLabelSchema.safeParse(item);
  return parsed.success ? parsed.data : null;
}

function parseLink(item: unknown): ApplicationLink | null {
  const parsed = applicationLinkSchema.safeParse(item);
  return parsed.success ? parsed.data : null;
}

export function toApplication(row: ApplicationRow): JobApplication {
  const stage = applicationStageSchema.safeParse(row.stage);
  return {
    id: row.id,
    position: row.position,
    company: row.company,
    stage: stage.success ? stage.data : 'saved',
    sortOrder: Number(row.sort_order) || 0,
    location: row.location,
    salary: row.salary,
    contact: row.contact,
    appliedOn: row.applied_on,
    nextStepOn: row.next_step_on,
    nextStep: row.next_step,
    resumeId: row.resume_id,
    labels: parseList(row.labels, parseLabel),
    links: parseList(row.links, parseLink),
    stageChangedAt: row.stage_changed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** The insert for a card added in the Add dialog, placed at `sortOrder` in its column. */
export function toApplicationInsert(values: AddApplicationFormValues, sortOrder: number): Job_ApplicationsInsertInput {
  const jobPostUrl = values.jobPostUrl.trim();
  const links: ApplicationLink[] = jobPostUrl ? [{ name: JOB_POST_LINK_NAME, url: jobPostUrl }] : [];
  return {
    position: values.position.trim(),
    company: values.company.trim(),
    stage: values.stage,
    sort_order: sortOrder,
    applied_on: values.appliedOn || null,
    resume_id: values.resumeId || null,
    links: JSON.stringify(links),
  };
}

/** The fields a card move or edit can change. */
export type ApplicationPatch = Partial<Pick<JobApplication, 'stage' | 'sortOrder' | 'appliedOn'>>;

export function toApplicationUpdate(patch: ApplicationPatch): Job_ApplicationsUpdateInput {
  const set: Job_ApplicationsUpdateInput = {};
  if (patch.stage !== undefined) {
    set.stage = patch.stage;
  }
  if (patch.sortOrder !== undefined) {
    set.sort_order = patch.sortOrder;
  }
  if (patch.appliedOn !== undefined) {
    set.applied_on = patch.appliedOn;
  }
  return set;
}

/** Applies a patch to a card the way the database will, for an optimistic update. */
export function applyApplicationPatch(application: JobApplication, patch: ApplicationPatch, now: Date): JobApplication {
  const next = { ...application, ...patch };
  if (patch.stage !== undefined && patch.stage !== application.stage) {
    next.stageChangedAt = now.toISOString();
  }
  return next;
}
