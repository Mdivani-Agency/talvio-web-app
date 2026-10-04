/**
 * Shared rules for public copy tests (MDI-322).
 * `/pricing` is excluded until MDI-320 redirects it.
 */

/** Terms no public page, title or description may contain, including the legal documents (MDI-322 definition of done). */
export const RELEASE_BANNED_TERMS =
  /credit|\bpacks?\b|pricing|subscription|\bplans?\b|upgrade|pay as you go|pay-as-you-go|never expire/i;

/** The messaging brief's vocabulary and voice rules, for marketing copy. Legal text is checked with the release list only. */
export const BRIEF_BANNED_TERMS =
  /credit|\bpacks?\b|pricing|\bprices?\b|subscription|\bplans?\b|upgrade|premium|pay as you go|pay-as-you-go|never expire|do not expire|free trial|free for now|free during beta|unlimited|\bCV\b|sign up|register|log in|AI-powered|ATS-proof|ATS-optimized|beats the ATS|pass(es)? the ATS|ATS pass|seamless|effortless|powerful|unlock|supercharge|dream job|guarantee|in minutes|in seconds|!/i;

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).length;
}

/** Sentences and lines, for the 18-word sentence limit. */
export function sentences(text: string): string[] {
  return text.split(/(?<=[.?])\s+|\n/).filter((sentence) => sentence.trim().length > 0);
}
