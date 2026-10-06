import { GENERATE_PDF_CREDITS, MONTHLY_CREDIT_ALLOWANCE } from './credits';

/** New resume PDFs the monthly allowance pays for (MDI-320): 90 / 30 = 3. */
export const MONTHLY_PDF_ALLOWANCE = MONTHLY_CREDIT_ALLOWANCE / GENERATE_PDF_CREDITS;

export type AllowanceStatus = {
  /** New resume PDFs the balance still pays for. */
  remaining: number;
  /** PDFs per month, or the remaining count if a legacy balance is larger. */
  total: number;
  /** The next reset: the 1st of the next UTC month at 00:00, matching the pg_cron job. */
  renewsOn: Date;
  exhausted: boolean;
};

export function nextAllowanceRenewal(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

export function allowanceStatus(balance: number, now: Date = new Date()): AllowanceStatus {
  const remaining = Math.max(0, Math.floor(balance / GENERATE_PDF_CREDITS));
  return {
    remaining,
    total: Math.max(MONTHLY_PDF_ALLOWANCE, remaining),
    renewsOn: nextAllowanceRenewal(now),
    exhausted: remaining === 0,
  };
}
