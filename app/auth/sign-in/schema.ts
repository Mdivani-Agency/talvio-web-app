import { z } from 'zod';

import { SIGN_IN_EMAIL_INVALID, SIGN_IN_EMAIL_REQUIRED } from '@/lib/sign-in-copy';

export const signInSchema = z.object({
  email: z.string().trim().min(1, { error: SIGN_IN_EMAIL_REQUIRED }).pipe(z.email({ error: SIGN_IN_EMAIL_INVALID })),
  name: z.string().optional(),
});

export type SignInValues = z.infer<typeof signInSchema>;
