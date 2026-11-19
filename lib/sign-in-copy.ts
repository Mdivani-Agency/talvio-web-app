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
