import type { ProfileQuestionDetail } from '@app/account/hooks/use-profile-improve';
import type { OnboardingQuestion } from '@lib/ai-improve/questions';
import type { ProfileReviewChange } from '@lib/llm/profile-proposal';
import type { AccountDto } from '@lib/types';
import { FROM_PROFILE, fromAnswer, GENERAL_TARGET, SECTION_LABELS } from '@/lib/profile-improve-copy';

import type { ReviewCard } from './views/review';

type Row = { id?: string; company?: string; name?: string };

const FIELD_LABELS: Record<string, string> = {
  role: 'Role',
  tagline: 'Tagline',
  additionalDetails: 'Description',
  achievements: 'Achievements',
  responsibilities: 'Responsibilities',
  keyContributions: 'Key contributions',
  add: 'Add',
};

function entryName(section: string, row: Row | undefined): string | null {
  const value = section === 'experience' ? row?.company : row?.name;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/** The chip above a question: "Experience · Northwind Health", "About you" or "Your profile". */
export function questionTarget(detail: ProfileQuestionDetail | undefined, account: AccountDto | null): string {
  const section = detail?.targetSection;
  if (!section) {
    return GENERAL_TARGET;
  }
  const label = SECTION_LABELS[section] ?? GENERAL_TARGET;
  const rows = (account as unknown as Record<string, Row[] | undefined> | null)?.[section];
  const name = detail.targetEntityId ? entryName(section, rows?.find((row) => row.id === detail.targetEntityId)) : null;
  return name ? `${label} · ${name}` : label;
}

/** Where a change applies: "About you · Tagline", "Experience · Northwind Health · Achievements", "Skills · Add". */
export function changeWhere(change: ProfileReviewChange): string {
  const section = change.section === 'profile' ? 'person' : change.section;
  const parts = [SECTION_LABELS[section] ?? GENERAL_TARGET];
  if (change.title) {
    parts.push(change.title);
  }
  parts.push(FIELD_LABELS[change.field] ?? change.field);
  return parts.join(' · ');
}

/** The review's cards, with the question number each change cites. */
export function reviewCards(changes: ProfileReviewChange[], questions: OnboardingQuestion[]): ReviewCard[] {
  return changes.map((change) => {
    const index = change.fromQuestionId ? questions.findIndex((question) => question.id === change.fromQuestionId) : -1;
    return {
      id: change.id,
      where: changeWhere(change),
      before: change.before,
      after: change.after,
      from: index >= 0 ? fromAnswer(index + 1) : FROM_PROFILE,
      selected: change.selected,
      claim: change.needsConfirmation ? (change.claims ?? []).join(' ') : '',
      confirmed: change.confirmed,
    };
  });
}
