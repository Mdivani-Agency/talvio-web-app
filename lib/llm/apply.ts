import { z } from 'zod';

import type { AiFieldChange } from '@lib/ai-improve/payload';

import { LLM_SCHEMA_VERSION, type SourceRef } from './contract';

/*
 * Saving an accepted LLM proposal (MDI-222). The LLM service never writes to the database: the
 * browser reviews the proposal, the user accepts it, and `apply_llm_proposal` writes the accepted
 * content and its receipt in one transaction. The receipt is the AI provenance of the resume (job,
 * proposal, change, omission and claim ids) and makes a repeated Accept a no-op that returns the
 * first receipt (`replayed`).
 *
 * The request follows the contract's `applyRequestSchema` plus the content to write, which only
 * the browser has.
 */

export type ApplyOperation = 'improve_resume' | 'tailor_resume';

/** Contract `applyTargetSchema`: an open resume draft at a revision, or a new resume. */
export type ApplyTarget =
  | { kind: 'resume_draft'; resumeId: string; baseRevision: string }
  | { kind: 'new_resume'; resumeType: 'job_specific'; derivedFrom: SourceRef };

/** improve_resume: the accepted document for a mutable resume at the revision the editor saved. */
export type ImproveResumeWrite = { id: string; expectedRevision: string; content: unknown };

/** tailor_resume: the new job-specific resume, created once per `clientDraftId`. */
export type TailorResumeWrite = {
  clientDraftId: string;
  name: string;
  label?: string | null;
  template: string;
  color: string;
  fontSize?: string | null;
  fontFamily?: string | null;
  content: unknown;
};

export type ApplySelection = {
  selectedChangeIds: string[];
  acceptedOmissionIds: string[];
  confirmedClaimIds: string[];
};

export type ApplyRequest = ApplySelection & {
  schemaVersion: string;
  proposalId: string;
  jobId: string | null;
  sessionId: string | null;
  idempotencyKey: string;
  source: SourceRef;
} & (
  | { operation: 'improve_resume'; target: Extract<ApplyTarget, { kind: 'resume_draft' }>; resume: ImproveResumeWrite }
  | { operation: 'tailor_resume'; target: Extract<ApplyTarget, { kind: 'new_resume' }>; resume: TailorResumeWrite }
);

export const applyReceiptSchema = z.looseObject({
  receiptId: z.string(),
  proposalId: z.string(),
  target: z.looseObject({ kind: z.string(), resumeId: z.string() }),
  resultingRevision: z.string(),
  appliedChangeIds: z.array(z.string()),
  acceptedOmissionIds: z.array(z.string()),
  replayed: z.boolean(),
});

export type ApplyReceipt = z.infer<typeof applyReceiptSchema>;

/** One key per proposal, so a retry after a lost answer is recognised as the same Accept. */
export function applyIdempotencyKey(proposalId: string): string {
  return `apply:${proposalId}`.slice(0, 128);
}

type RawChange = { id: string; confirmation?: unknown };

function claimIds(change: RawChange): string[] {
  const confirmation = change.confirmation as { claims?: unknown } | undefined;
  if (!Array.isArray(confirmation?.claims)) {
    return [];
  }
  return confirmation.claims.flatMap((claim) => {
    const id = (claim as { id?: unknown } | null)?.id;
    return typeof id === 'string' && id ? [id] : [];
  });
}

/**
 * What the user accepted, as the contract's id lists: the reviewed changes that apply (no
 * confirmation needed, or confirmed), the claims they confirmed, and the omissions they did not
 * keep. Changes the review dropped because the document no longer matched are not included.
 */
export function applySelection({
  reviewed,
  changes,
  confirmed,
  omissions = [],
  kept = new Set(),
}: {
  reviewed: Pick<AiFieldChange, 'id' | 'needsConfirmation'>[];
  changes: RawChange[];
  confirmed: ReadonlySet<string>;
  omissions?: { id: string }[];
  kept?: ReadonlySet<string>;
}): ApplySelection {
  const selected = new Set<string>();
  for (const change of reviewed) {
    if (change.id && (!change.needsConfirmation || confirmed.has(change.id))) {
      selected.add(change.id);
    }
  }
  const confirmedClaimIds = changes
    .filter((change) => selected.has(change.id) && confirmed.has(change.id))
    .flatMap(claimIds);
  return {
    selectedChangeIds: [...selected],
    acceptedOmissionIds: omissions.map((item) => item.id).filter((id) => !kept.has(id)),
    confirmedClaimIds: [...new Set(confirmedClaimIds)],
  };
}

export function applyRequestBase(input: {
  proposalId: string;
  jobId: string | null;
  sessionId: string | null;
  source: SourceRef;
  selection: ApplySelection;
}) {
  return {
    schemaVersion: LLM_SCHEMA_VERSION,
    proposalId: input.proposalId,
    jobId: input.jobId,
    sessionId: input.sessionId,
    idempotencyKey: applyIdempotencyKey(input.proposalId),
    source: input.source,
    ...input.selection,
  };
}

const APPLY_ERRORS: Record<string, string> = {
  resume_changed: 'This resume changed after the suggestions were made. Close them and start again.',
  resume_generated: 'This resume already has a PDF. Create a draft to change it.',
  resume_generation_in_progress: 'A PDF is being created for this resume. Try again when it is ready.',
  resume_not_found: 'Resume not found',
  invalid_apply_request: 'The changes could not be saved. Try again.',
};

/** The message for an apply failure, or null when the error is not one of apply's own. */
export function applyErrorMessage(text: string): string | null {
  const code = Object.keys(APPLY_ERRORS).find((key) => text.includes(key));
  return code ? APPLY_ERRORS[code] : null;
}
