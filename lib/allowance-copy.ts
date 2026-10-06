/**
 * In-app copy for the monthly resume PDF allowance (MDI-400). Counts resume PDFs, never credits,
 * and follows the MDI-322 brief vocabulary.
 */

export const ALLOWANCE_CARD_TITLE = 'Resume PDFs';
export const ALLOWANCE_LOADING = 'Loading your resume PDFs';
export const ALLOWANCE_ERROR = 'Could not load your resume PDFs.';
export const ALLOWANCE_RETRY = 'Try again';
export const GENERATE_PDF_LABEL = 'Generate PDF';
export const REDOWNLOAD_NOTE = 'Re-downloads of a generated PDF are always free.';

const renewalDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });

/** "1 November", in UTC like the reset itself. */
export function formatRenewalDate(date: Date): string {
  return renewalDate.format(date);
}

export function allowanceRemainingLine(remaining: number, total: number): string {
  return `${remaining} of ${total} left this month`;
}

export function allowanceRenewsLine(renewsOn: Date): string {
  return `Renews on ${formatRenewalDate(renewsOn)}`;
}

/** Shown when no new PDF is left: on the account card, in the generate dialog and in the error toast. */
export function allowanceExhaustedLine(total: number, renewsOn: Date): string {
  return `No new resume PDFs left this month. You get ${total} more on ${formatRenewalDate(renewsOn)}.`;
}

/** Next to a disabled generate button. */
export function generateBlockedNote(renewsOn: Date): string {
  return `Next PDF on ${formatRenewalDate(renewsOn)}`;
}

export function generateDialogLine(remaining?: number, total?: number): string {
  const lead = 'Your resume is ready. Generating the final PDF uses 1 of your monthly resume PDFs.';
  const left = remaining != null && total != null ? ` You have ${allowanceRemainingLine(remaining, total)}.` : '';
  return `${lead}${left} Re-downloads of that file stay free.`;
}

export const REDOWNLOAD_DIALOG_LINE = 'Your resume PDF is ready. Download it again at no extra cost.';

/** Every string above, for the vocabulary test. */
export function allowanceCopyText(): string {
  const renewsOn = new Date('2026-11-01T00:00:00Z');
  return [
    ALLOWANCE_CARD_TITLE,
    ALLOWANCE_LOADING,
    ALLOWANCE_ERROR,
    ALLOWANCE_RETRY,
    GENERATE_PDF_LABEL,
    REDOWNLOAD_NOTE,
    allowanceRemainingLine(2, 3),
    allowanceRenewsLine(renewsOn),
    allowanceExhaustedLine(3, renewsOn),
    generateBlockedNote(renewsOn),
    generateDialogLine(2, 3),
    generateDialogLine(),
    REDOWNLOAD_DIALOG_LINE,
  ].join('\n');
}
