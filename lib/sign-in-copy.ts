/** Sign-in screen copy. Signing in with any option creates the account; there is no separate sign-up. */
export const SIGN_IN_HEADING = 'Start free or sign in';
export const SIGN_IN_INTRO = 'New here? Signing in creates your account. No card needed.';
export const SIGN_IN_GOOGLE_LABEL = 'Continue with Google';
export const SIGN_IN_DIVIDER = 'or';

export const SIGN_IN_EMAIL_LABEL = 'Email';
export const SIGN_IN_EMAIL_PLACEHOLDER = 'name@example.com';
export const SIGN_IN_EMAIL_REQUIRED = 'Enter your email address.';
export const SIGN_IN_EMAIL_INVALID = 'Enter a valid email address, like name@example.com.';
export const SIGN_IN_SUBMIT_LABEL = 'Continue with email';
export const SIGN_IN_SENDING_LABEL = 'Sending link…';

/** Shown in the card's alert for Supabase's email rate limit (`over_email_send_rate_limit`, HTTP 429). */
export const SIGN_IN_RATE_LIMIT = 'Too many sign-in emails. Wait a minute, then try again.';

export const SIGN_IN_LINKEDIN_NOTE = 'Used LinkedIn before? Request an email link for that same address.';

/** The line under the card. Terms section 2 already says that using Talvio means agreeing to them. */
export const SIGN_IN_AGREEMENT = {
  before: 'By continuing, you agree to the ',
  terms: { label: 'Terms of Service', href: '/terms' },
  between: ' and ',
  privacy: { label: 'Privacy Policy', href: '/privacy-policy' },
  after: '.',
} as const;

/** "Check your email" (`/auth/verify-request`). */
export const VERIFY_HEADING = 'Check your email';
export const VERIFY_SENT_TO = { before: 'We sent a sign-in link to ', after: '.' } as const;
/** When the page is opened without a stored address. */
export const VERIFY_SENT_GENERIC = 'We sent a sign-in link to your email.';
export const VERIFY_SAME_BROWSER = 'Open it on this device and in this browser to finish signing in.';
export const VERIFY_RESEND_HINT = "Didn't get it? Check your spam folder, or send a new link.";
export const VERIFY_RESEND_LABEL = 'Resend link';
export const VERIFY_RESENT = 'We sent a new link.';
export const VERIFY_DIFFERENT_EMAIL = 'Use a different email';

/** Supabase's own limit between sign-in emails to one address. */
export const RESEND_COOLDOWN_SECONDS = 60;

/** "Resend in 0:59" while the cooldown runs. */
export function resendCountdownLabel(secondsLeft: number): string {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, '0');
  return `Resend in ${minutes}:${seconds}`;
}

// Link error page (`/auth/error`), shown when a sign-in link or provider sign-in fails.
export const LINK_ERROR_HEADING = "This sign-in link didn't work";
export const LINK_ERROR_BODY =
  'It may have expired, been used already, or been opened in a different browser. Request a new link to sign in.';
export const LINK_ERROR_BACK_LABEL = 'Back to sign in';
export const LINK_ERROR_HOME_LABEL = 'Go home';

/** "Error code: auth_callback_failed", for support requests. */
export function linkErrorCodeLabel(code: string): string {
  return `Error code: ${code}`;
}
