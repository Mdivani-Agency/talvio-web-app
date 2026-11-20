import { accountDtoToSavePayload } from '@lib/adapters/profile.adapter';
import { AI_ITEM_SECTIONS, documentToAiPayload, type AiFieldChange, type AiItemSection } from '@lib/ai-improve/payload';
import { profileToResumeDocument } from '@lib/models/resume-document';
import type { AccountDto } from '@lib/types';

import { applyRequestBase, applySelection } from './apply';
import type { SourceRef } from './contract';
import { reviewServiceProposal, type ServiceProposal, type ServiceReview } from './improve-proposal';

/*
 * An improve_profile proposal reviewed after Save profile (MDI-645). The proposal is read against
 * the saved profile in the resume-shaped view the session was built from, so the same rules as the
 * resume editor hold: a change whose original no longer matches the profile is dropped, and a
 * change that needs confirmation applies only once its claims are confirmed. On top of that the
 * user picks which changes to keep: every change starts selected.
 *
 * What is saved is the saved profile with only the selected changes written in: the role and
 * tagline, the text fields of the entries a change targets, and added skills, tools, languages and
 * links. Every other field (contacts, dates, employers, titles) is sent as it was loaded, so
 * nothing outside a change is rewritten.
 */

type Item = Record<string, unknown>;
type AddSection = 'skills' | 'tools' | 'languages' | 'links';
const ADD_SECTIONS: readonly AddSection[] = ['skills', 'tools', 'languages', 'links'];

export type ProfileReviewChange = AiFieldChange & {
  id: string;
  selected: boolean;
  confirmed: boolean;
  /** The question whose answer the change cites, or null when it comes from the profile alone. */
  fromQuestionId: string | null;
};

/** The first answer a raw change cites as evidence. */
function answerQuestionId(change: unknown): string | null {
  const evidence = (change as { evidence?: unknown } | null)?.evidence;
  if (!Array.isArray(evidence)) {
    return null;
  }
  for (const item of evidence) {
    const ref = item as { sourceKind?: unknown; questionId?: unknown } | null;
    if (ref?.sourceKind === 'answer' && typeof ref.questionId === 'string') {
      return ref.questionId;
    }
  }
  return null;
}

export type ProfileReview = {
  proposalId: string;
  summary: string;
  /** Every change still valid against the saved profile, in proposal order. */
  changes: ProfileReviewChange[];
  /** Changes left out because the profile no longer matched them or the form cannot hold them. */
  skipped: number;
  /** Selected changes that need their claims confirmed before Save. */
  unconfirmed: string[];
  /** The changes Save would write: selected, and confirmed where they need it. */
  applied: AiFieldChange[];
  /** The profile with the applied changes written in. */
  account: AccountDto;
};

function selectedProposal(proposal: ServiceProposal, selected: ReadonlySet<string>): ServiceProposal {
  return { ...proposal, changes: proposal.changes.filter((change) => selected.has(change.id)) };
}

/** Applies the selected text changes and additions to the saved profile. */
function acceptedAccount(account: AccountDto, review: ServiceReview): AccountDto {
  if (!review.changes.length) {
    return account;
  }
  const accepted = documentToAiPayload(review.resume) as unknown as Record<string, Item[]> & { profile: Item };
  let next: AccountDto = account;

  // Read from the reviewed document itself: the payload view drops an empty tagline, and an
  // accepted change may clear it.
  const reviewedProfile = (review.resume.profile ?? {}) as Item;
  const profilePatch: Item = {};
  for (const change of review.changes) {
    if (change.section === 'profile' && (change.field === 'role' || change.field === 'tagline')) {
      const value = reviewedProfile[change.field];
      profilePatch[change.field] = typeof value === 'string' ? value : '';
    }
  }
  if (Object.keys(profilePatch).length) {
    next = { ...next, profile: { ...next.profile, ...profilePatch } };
  }

  for (const section of AI_ITEM_SECTIONS) {
    const fields = new Map<number, Set<string>>();
    for (const change of review.changes) {
      if (change.section === section && typeof change.index === 'number') {
        fields.set(change.index, (fields.get(change.index) ?? new Set()).add(change.field));
      }
    }
    if (!fields.size) {
      continue;
    }
    const rows = ((next as unknown as Record<AiItemSection, Item[] | undefined>)[section] ?? []).map((row, index) => {
      const changed = fields.get(index);
      const source = accepted[section]?.[index];
      if (!changed || !source) {
        return row;
      }
      const patch: Item = {};
      for (const field of changed) {
        patch[field] = source[field];
      }
      return { ...row, ...patch };
    });
    next = { ...next, [section]: rows } as AccountDto;
  }

  for (const section of ADD_SECTIONS) {
    const before = ((account as unknown as Record<AddSection, Item[] | undefined>)[section] ?? []).length;
    const after = (review.resume as unknown as Record<AddSection, Item[] | undefined>)[section] ?? [];
    // New rows: no id, so save_profile inserts them.
    const added = after.slice(before).map((item) => {
      const row = { ...item };
      delete row.id;
      return row;
    });
    if (added.length) {
      const current = (next as unknown as Record<AddSection, Item[] | undefined>)[section] ?? [];
      next = { ...next, [section]: [...current, ...added] } as AccountDto;
    }
  }
  return next;
}

/**
 * The proposal against the saved profile. `selected` holds the change ids the user keeps (all of
 * them to start with), `confirmed` the ids whose claims the user confirmed.
 */
export function reviewProfileProposal(
  account: AccountDto,
  proposal: ServiceProposal,
  selected: ReadonlySet<string>,
  confirmed: ReadonlySet<string>,
): ProfileReview {
  const resume = profileToResumeDocument(account);
  const all = reviewServiceProposal(resume, proposal, confirmed);
  const kept = reviewServiceProposal(resume, selectedProposal(proposal, selected), confirmed);
  const applied = kept.changes.filter((change) => !change.needsConfirmation || (change.id !== undefined && confirmed.has(change.id)));
  const changes = all.changes.flatMap((change): ProfileReviewChange[] =>
    change.id
      ? [{
          ...change,
          id: change.id,
          selected: selected.has(change.id),
          confirmed: confirmed.has(change.id),
          fromQuestionId: answerQuestionId(proposal.changes.find((raw) => raw.id === change.id)),
        }]
      : [],
  );
  return {
    proposalId: proposal.proposalId,
    summary: proposal.summary,
    changes,
    skipped: all.skipped,
    unconfirmed: changes.filter((change) => change.selected && change.needsConfirmation && !change.confirmed).map((change) => change.id),
    applied,
    account: acceptedAccount(account, { ...kept, changes: applied }),
  };
}

/** The `apply_llm_proposal` request for an accepted profile review (`improve_profile`). */
export function profileApplyRequest(input: {
  review: ProfileReview;
  proposal: ServiceProposal;
  confirmed: ReadonlySet<string>;
  jobId: string | null;
  sessionId: string | null;
  source: Extract<SourceRef, { kind: 'profile' }>;
}) {
  const { review, proposal, confirmed, source } = input;
  return {
    ...applyRequestBase({
      proposalId: proposal.proposalId,
      jobId: input.jobId,
      sessionId: input.sessionId,
      source,
      selection: applySelection({ reviewed: review.applied, changes: proposal.changes, confirmed }),
    }),
    operation: 'improve_profile' as const,
    target: { kind: 'profile' as const, profileId: source.id, baseRevision: source.revision },
    profile: accountDtoToSavePayload(review.account),
  };
}
