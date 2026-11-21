/**
 * Copy for "Make your profile stronger" after Save profile (MDI-646, epic MDI-643), from the "Talvio UI Refresh"
 * canvas, page Onboarding, section "AI questions after Save profile".
 */

export const IMPROVE_HREF = '/account/improve';
/** `/account/improve?saved=1` shows the "Profile saved" banner: the first visit right after onboarding. */
export const IMPROVE_AFTER_SAVE_HREF = `${IMPROVE_HREF}?saved=1`;
export const ACCOUNT_HREF = '/account';
export const RESUME_HREF = '/resume';

export const IMPROVE_EYEBROW = 'Make your profile stronger';

/* Account page card (OBA-card), shown until the improvement is used */
export const CARD_BODY = 'Answer up to 5 questions and get suggested edits. Free, once per account.';
export const CARD_START_LABEL = 'Answer a few questions';
export const CARD_CONTINUE_LABEL = 'Continue the questions';

/* Offer */
export const PROFILE_SAVED_BANNER = 'Profile saved. Every resume you create starts from it.';
export const FREE_ONCE_TAG = 'Free, once per account';
export const OFFER_TITLE = 'Answer a few questions, get better wording';
export const OFFER_BODY =
  'We read your profile and ask up to 5 short questions about the parts that say the least. From your answers we suggest edits. You choose what to keep. Nothing changes until you save.';
export const OFFER_POINTS = [
  { title: 'A few minutes', body: 'Up to 5 questions, one at a time.' },
  { title: 'Skip any question', body: 'Only answer what you want to.' },
  { title: 'You decide', body: 'Review each edit before it is saved.' },
] as const;
export const START_QUESTIONS_LABEL = 'Start the questions';
export const SKIP_FOR_NOW_LABEL = 'Skip for now';
export const AI_NOTICE =
  "Uses AI. Your profile and answers are sent to Talvio's AI service and deleted from it after 7 days. You can come back to this from your account at any time.";

/* Loading */
export const LOADING_QUESTIONS_TITLE = 'Reading your profile';
export const LOADING_PROPOSAL_TITLE = 'Writing suggestions from your answers';
export const LOADING_QUESTIONS_STEPS = ['Reading your profile', 'Picking questions for you'] as const;
export const LOADING_PROPOSAL_STEPS = ['Sending your answers', 'Writing suggested edits'] as const;
export const LOADING_NOTE = 'This can take a minute. The page unlocks when your questions are ready.';
export const CANCEL_LABEL = 'Cancel';

/* Question */
export const questionCounter = (n: number, total: number) => `Question ${n} of ${total}`;
export const PROGRESS_LABEL = 'Questions answered';
export const WHY_WE_ASK = 'Why we ask:';
export const ANSWER_LABEL = 'Your answer';
export const ANSWER_PLACEHOLDER = 'Write it the way you would say it';
export const ANSWER_MAX = 2_000;
export const answerCount = (count: number) => `${count.toLocaleString('en-US')} / ${ANSWER_MAX.toLocaleString('en-US')}`;
export const LAST_QUESTION_NOTE =
  'Getting suggested edits uses your one free profile improvement. Stop before this and you can come back to it later.';
export const BACK_LABEL = 'Back';
export const SKIP_QUESTION_LABEL = 'Skip this question';
export const NEXT_LABEL = 'Next';
export const GET_EDITS_LABEL = 'Get suggested edits';
export const ANSWERS_KEPT_NOTE = 'Answers are kept on this device as you type.';
export const STOP_LABEL = 'Stop and keep my profile as it is';

/** The chip above a question: the section, and the entry when the question names one. */
export const SECTION_LABELS: Record<string, string> = {
  person: 'About you',
  experience: 'Experience',
  education: 'Education',
  projects: 'Projects',
  recommendations: 'Recommendations',
  skills: 'Skills',
  tools: 'Tools',
  languages: 'Languages',
  links: 'Links',
};
export const GENERAL_TARGET = 'Your profile';

/* Nothing to ask (zero questions) */
export const NOTHING_TO_ASK_TITLE = 'Your profile already answers our questions';
export const NOTHING_TO_ASK_BODY = 'We have no questions for you. We can still suggest edits from your profile as it is.';

/* Review */
export const reviewTitle = (n: number) => `${n} suggested ${n === 1 ? 'edit' : 'edits'}`;
export const REVIEW_INTRO =
  "Each edit comes from your profile or your answers. Untick any you don't want. Your profile changes only when you save.";
export const NOW_PREFIX = 'Now: ';
export const SUGGESTED_PREFIX = 'Suggested: ';
export const fromAnswer = (questionNumber: number) => `From your answer to question ${questionNumber}`;
export const FROM_PROFILE = 'From your profile';
export const CONFIRM_TRUE = 'Confirm it is true:';
/** For an edit that needs confirming when the service named no fact. */
export const CLAIM_FALLBACK = 'This edit is accurate.';
export const CLAIM_MISSING = 'Confirm the highlighted fact or untick that edit to save.';
export const saveEditsLabel = (n: number) => (n === 0 ? 'Save no edits' : `Save ${n} ${n === 1 ? 'edit' : 'edits'} to my profile`);
export const KEEP_PROFILE_LABEL = 'Keep my profile as it is';
export const SKIPPED_EDITS_NOTE = (n: number) =>
  `${n} ${n === 1 ? 'suggestion was' : 'suggestions were'} left out because your profile changed after it was made.`;
export const NO_EDITS_TITLE = 'No edits to suggest';
export const NO_EDITS_BODY = 'Your profile reads well as it is. Nothing was changed.';

/* Done */
export const doneTitle = (n: number) => `${n} ${n === 1 ? 'edit' : 'edits'} saved to your profile`;
export const DONE_BODY = 'Your next resume starts from the updated profile. You can edit anything in your account.';
export const CREATE_RESUME_LABEL = 'Create a resume';
export const GO_TO_ACCOUNT_LABEL = 'Go to my account';

/* Used */
export const USED_TITLE = 'You have used your free profile improvement';
export const usedBody = (ranOn: string | null) =>
  `Each account gets it once${ranOn ? `, and yours ran on ${ranOn}` : ''}. You can still edit your profile yourself, and Improve with AI in the resume editor works on each resume.`;

/* Limit and other refusals */
export const LIMIT_TITLE = "AI has reached today's limit";
export const limitBody = (resetsAt: string) =>
  `Each account can run 20 AI tasks a day, and one round of questions uses 3. It resets at ${resetsAt} your time.`;
export const LATER_NOTE = 'Your profile is saved. You can start the questions from your account later.';
export const UNAVAILABLE_TITLE = 'AI is not available for this account';
export const ERROR_TITLE = 'Something went wrong';
export const EXPIRED_TITLE = 'This session ended';
export const EXPIRED_BODY = 'Start again to get new questions. Your free improvement is still there if you did not get suggested edits.';
export const START_AGAIN_LABEL = 'Start again';
export const SIGN_IN_TITLE = 'Sign in again to continue';
export const SIGN_IN_LABEL = 'Sign in';
export const TRY_AGAIN_LABEL = 'Try again';
export const SAVE_SUCCESS = 'Your profile is updated.';

/** The daily reset (00:00 UTC) in the user's own time, such as "4:00 AM". */
export function limitResetTime(locale?: string): string {
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(new Date(Date.UTC(2026, 0, 1, 0, 0)));
}

/** The day the improvement ran, such as "12 November". */
export function usedOnDate(usedAt: string | null, locale = 'en-GB'): string | null {
  if (!usedAt) {
    return null;
  }
  const date = new Date(usedAt);
  return Number.isNaN(date.getTime()) ? null : new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(date);
}
