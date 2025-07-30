import { z } from 'zod';

export const signInSchema = z.object({
  email: z.email(),
  name: z.string().optional(),
});

export type SignInValues = z.infer<typeof signInSchema>;
