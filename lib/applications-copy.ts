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

/** The card detail panel (MDI-657). */
export const DETAIL_CLOSE_LABEL = 'Close';
export const DETAIL_LOADING = 'Loading notes and history…';
export const DETAIL_LOAD_ERROR = "Notes and history didn't load.";
export const DETAIL_RETRY_LABEL = 'Try again';
export const DETAIL_FIELDS = {
  stage: { label: 'Stage' },
  nextStepOn: { label: 'Next step on' },
  nextStep: { label: 'Next step', placeholder: 'For example: technical interview with the team' },
  position: { label: 'Position' },
  company: { label: 'Company' },
  location: { label: 'Location (optional)', placeholder: 'City, country or remote' },
  salary: { label: 'Salary (optional)', placeholder: 'As listed or discussed' },
  appliedOn: { label: 'Applied on (optional)' },
  contact: { label: 'Contact (optional)', placeholder: 'Name and role' },
} as const;
export const DETAILS_TITLE = 'Details';
export const SAVE_HINT = 'Changes save as you go';
export const SAVING_LABEL = 'Saving…';
export const SAVED_LABEL = 'Saved';
export const SAVE_FAILED_LABEL = "Couldn't save.";
export const SAVE_RETRY_LABEL = 'Retry';
export const SAVE_FAILED_MESSAGE = "Couldn't save your change.";

export const RESUME_SENT_TITLE = 'Resume sent';
export const RESUME_SENT_SELECT_LABEL = 'Resume sent';
export const RESUME_SENT_PLACEHOLDER = 'Choose one of your resumes';
export const RESUME_OPEN_LABEL = 'Open';
export const RESUME_DOWNLOAD_LABEL = 'Download PDF';
export const RESUME_CHANGE_LABEL = 'Change';
export const RESUME_REMOVE_LABEL = 'Remove';
export const RESUME_DRAFT_LINE = 'Draft, no PDF yet';
export function resumeGeneratedLine(date: string): string {
  return `PDF · generated ${date}`;
}

export const LINKS_TITLE = 'Links';
export const ADD_LINK_LABEL = 'Add a link';
export const LINK_FIELDS = {
  name: { label: 'Link name', placeholder: 'Job post, cover letter…' },
  url: { label: 'URL', placeholder: 'https://' },
} as const;
export const LINK_SAVE_LABEL = 'Add link';
export function removeLinkLabel(name: string): string {
  return `Remove link ${name}`;
}

export const LABELS_TITLE = 'Labels';
export const ADD_LABEL_LABEL = '+ Label';
export const LABEL_NAME_LABEL = 'Label name';
export const LABEL_NAME_PLACEHOLDER = 'Remote, referral…';
export const LABEL_COLOR_LABEL = 'Colour';
export const LABEL_SAVE_LABEL = 'Add label';
export const LABEL_DUPLICATE_ERROR = 'This card already has that label';
export const LABEL_COLOR_NAMES = {
  gray: 'Grey',
  blue: 'Blue',
  green: 'Green',
  amber: 'Amber',
  red: 'Red',
  pink: 'Pink',
  purple: 'Purple',
  teal: 'Teal',
} as const;
export function removeLabelLabel(name: string): string {
  return `Remove label ${name}`;
}

export const NOTES_TITLE = 'Notes';
export const NOTE_EDITOR_LABEL = 'Note';
export const NOTE_PLACEHOLDER = 'Add a note. Lists are supported.';
export const ADD_NOTE_LABEL = 'Add note';
export const NOTE_SAVE_LABEL = 'Save note';
export const NOTE_CANCEL_LABEL = 'Cancel';
export const NOTE_TOO_LONG = 'This note is too long. Keep it under 5,000 characters.';
export const BULLET_LIST_LABEL = 'Bulleted list';
export const NUMBERED_LIST_LABEL = 'Numbered list';
export const DELETE_NOTE_TITLE = 'Delete note';
export const DELETE_NOTE_DESCRIPTION = 'Delete this note? This cannot be undone.';
export const NOTE_DELETED_MESSAGE = 'Note deleted';
export function editNoteLabel(date: string): string {
  return `Edit note from ${date}`;
}
export function deleteNoteLabel(date: string): string {
  return `Delete note from ${date}`;
}

export const HISTORY_TITLE = 'History';
export const HISTORY_ADDED = 'Added as';
export const HISTORY_MOVED = 'Moved to';

export const DELETE_APPLICATION_LABEL = 'Delete';
export const DELETE_APPLICATION_TITLE = 'Delete application';
export const DELETE_APPLICATION_DESCRIPTION = 'Delete this application? Its notes are deleted too.';
export const APPLICATION_DELETED_MESSAGE = 'Application deleted';

const FULL_DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** "17 Nov 2026", for notes, history and the resume line. Pass a calendar day (UTC midnight). */
export function fullDate(value: Date): string {
  return FULL_DATE.format(value);
}

/** The panel's subheading: "Fjord Analytics · Remote, EU". */
export function detailSubheading(company: string, location: string | null): string {
  return location?.trim() ? `${company} · ${location.trim()}` : company;
}

/** "Add to tracker" after a new resume PDF, and the tracker links elsewhere (MDI-658). */
export const TRACKER_PROMPT_TITLE = 'Applying with this resume?';
export const TRACKER_PROMPT_BODY = 'Add it to your tracker so you know what you sent where.';
export const TRACKER_PROMPT_ADD_LABEL = 'Add to tracker';
export const TRACKER_PROMPT_DISMISS_LABEL = 'Dismiss';
export const VIEW_IN_TRACKER_LABEL = 'View in tracker';
export const IN_TRACKER_LABEL = 'In tracker';

/** The tracker with a card's panel open. */
export function cardHref(applicationId: string): string {
  return `/account/applications?card=${encodeURIComponent(applicationId)}`;
}
