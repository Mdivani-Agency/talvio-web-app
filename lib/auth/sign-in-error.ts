import { SIGN_IN_RATE_LIMIT } from '@/lib/sign-in-copy';

type AuthErrorLike = { message: string; code?: string; status?: number };

/** The text for the sign-in card's alert: Supabase's email rate limit gets plain copy, anything else keeps its message. */
export function signInErrorMessage(error: AuthErrorLike): string {
  if (error.code === 'over_email_send_rate_limit' || error.status === 429) {
    return SIGN_IN_RATE_LIMIT;
  }
  return error.message;
}
