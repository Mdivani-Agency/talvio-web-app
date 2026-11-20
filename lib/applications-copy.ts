import type { ApplicationStage, BoardColumn, ClosedStage } from '@lib/schema/application.schema';

/** Copy for the application tracker (MDI-656). */

export const APPLICATIONS_TITLE = 'Applications';
export const APPLICATIONS_LOADING = 'Loading your applications...';
export const APPLICATIONS_ERROR_TITLE = "Your applications didn't load";
export const APPLICATIONS_ERROR_BODY = 'Check your connection and try again.';

export const ADD_APPLICATION_LABEL = 'Add application';
export const SEARCH_LABEL = 'Search applications';
export const SEARCH_PLACEHOLDER = 'Search';

export const EMPTY_TITLE = 'Keep track of every application';
export const EMPTY_BODY =
  'Save a job you like, note when you applied and which resume you sent, and move it along as you hear back.';
export const EMPTY_CTA_LABEL = 'Add your first application';

export const LABEL_FILTER_GROUP_LABEL = 'Filter by label';
export const LABEL_FILTER_TITLE = 'Labels';
export const CLEAR_FILTER_LABEL = 'Clear';
export const NO_MATCHING_CARDS = 'No cards with these labels';
export const NO_SEARCH_MATCHES = 'No cards match your search';

export const BOARD_LABEL = 'Applications by stage';
export const STAGE_TABS_LABEL = 'Stage';
export const RESUME_LINKED_LABEL = 'Resume linked';
export const MOVE_MENU_TITLE = 'Move to…';
export const CLOSED_OUTCOME_TITLE = 'How did it end?';
export const MOVE_FAILED_MESSAGE = "Couldn't move the card. It's back where it was.";

export const STAGE_NAMES: Record<ApplicationStage, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interview: 'Interview',
  offer: 'Offer',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export const COLUMN_NAMES: Record<BoardColumn, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interview: 'Interview',
  offer: 'Offer',
  closed: 'Closed',
};

/** The dashed hint in an empty column. */
export const COLUMN_EMPTY_HINTS: Record<BoardColumn, string> = {
  saved: 'Jobs you want to apply to',
  applied: 'Drag a card here once you apply',
  interview: 'Nothing here yet',
  offer: 'Nothing here yet',
  closed: 'Accepted, rejected and withdrawn',
};

export const OUTCOME_NAMES: Record<ClosedStage, string> = {
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

/** The Add application dialog. */
export const ADD_DIALOG_TITLE = 'Add an application';
export const ADD_DIALOG_DESCRIPTION = 'Add the job now; you can fill in the rest later.';
export const ADD_FIELDS = {
  position: { label: 'Position', placeholder: 'Staff Software Engineer' },
  company: { label: 'Company', placeholder: 'Company name' },
  jobPostUrl: { label: 'Job post link (optional)', placeholder: 'https://' },
  stage: { label: 'Stage' },
  appliedOn: { label: 'Applied on (optional)' },
  resumeId: { label: 'Resume sent (optional)', placeholder: 'Choose one of your resumes', none: 'No resume' },
} as const;
/** The resume picker could not load the user's resumes; "No resume" is not the whole list. */
export const RESUMES_LOAD_ERROR = "Your resumes didn't load, so you can't pick one yet.";
export const RESUMES_RETRY_LABEL = 'Try again';
export const ADD_CANCEL_LABEL = 'Cancel';
export const ADD_SUBMIT_LABEL = 'Add application';
export const APPLICATION_ADDED_MESSAGE = 'Application added';

export const FOLLOW_UP_LABEL = 'Follow up?';
export const FOLLOW_UP_AFTER_DAYS = 14;

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

export const NOTHING_TRACKED = 'Nothing tracked yet';

/** "5 applications · 3 active" under the heading, or "Nothing tracked yet". */
export function applicationsSummary(total: number, active: number): string {
  if (total === 0) {
    return NOTHING_TRACKED;
  }
  return `${plural(total, 'application', 'applications')} · ${active} active`;
}

/** "Showing 2 of 5 applications" while a label filter or search is on. */
export function filteredSummary(shown: number, total: number): string {
  return `Showing ${shown} of ${plural(total, 'application', 'applications')}`;
}

/** The three-dots button names the card it moves. */
export function moveCardLabel(position: string, company: string): string {
  return `Move ${position} at ${company} to another stage`;
}

/** A stage tab on phone: "Applied 3". */
export function stageTabLabel(name: string, count: number): string {
  return `${name} ${count}`;
}

const SHORT_DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const LONG_DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** "14 Nov", or "14 Nov 2025" outside the current year. Dates are read as calendar days (UTC). */
export function cardDate(value: Date, today: Date): string {
  return value.getUTCFullYear() === today.getUTCFullYear() ? SHORT_DATE.format(value) : LONG_DATE.format(value);
}

export const DATE_LINE_PREFIX = {
  saved: 'Saved',
  applied: 'Applied',
  interview: 'Interview since',
  offer: 'Offer received',
  closed: 'Closed',
  nextStep: 'Next step',
} as const;
