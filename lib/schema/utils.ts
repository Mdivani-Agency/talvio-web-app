import { z, RefinementCtx } from 'zod';

export const phoneNumberPattern = /^\+?\d+$/;

export const urlSchema = z.string().url({ message: 'Please enter a valid URL' });
export const emailSchema = z.string().email({ message: 'Please enter a valid email' });
export const phoneSchema = z.string().regex(phoneNumberPattern, { message: 'Please enter a valid phone number' });

export const refineContacts = (data: { email?: string; phone?: string; website?: string }, ctx: RefinementCtx) => {
  if (data.email !== undefined) {
    const emailResult = emailSchema.safeParse(data.email);
    if (!emailResult.success) {
      return ctx.addIssue({
        path: ['email'],
        code: 'custom',
        message: (emailResult.error.cause as string) || 'Invalid email format',
      });
    }
  }
  if (data.phone !== undefined) {
    const { success, error } = phoneSchema.safeParse(data.phone);
    if (!success) {
      return ctx.addIssue({
        path: ['phone'],
        code: 'custom',
        message: (error.cause as string) || 'Invalid phone number',
      });
    }
  }
  if (data.website !== undefined) {
    const urlResult = urlSchema.safeParse(data.website);
    if (!urlResult.success) {
      return ctx.addIssue({
        path: ['website'],
        code: 'custom',
        message: (urlResult.error.cause as string) || 'Invalid Website URL',
      });
    }
  }

  if (!data.email && !data.phone && !data.website) {
    return ctx.addIssue({
      path: ['email', 'phone', 'website'],
      code: 'custom',
      message: 'At least one contact detail is required',
    });
  }

  return true;
};

export const refineProfile = (data: Partial<{ firstName: string; lastName: string; role: string; email?: string; phone?: string; website?: string }>, ctx: RefinementCtx) => {
  if (!data.firstName) {
    return ctx.addIssue({
      path: ['firstName'],
      code: 'custom',
      message: 'First name is required',
    });
  }
  if (!data.lastName) {
    return ctx.addIssue({
      path: ['lastName'],
      code: 'custom',
      message: 'Last name is required',
    });
  }
  if (!data.role) {
    return ctx.addIssue({
      path: ['role'],
      code: 'custom',
      message: 'Role is required',
    });
  }

  return refineContacts(data, ctx);
};

export const refineLinks = (data: { value: string; type: string }, ctx: RefinementCtx) => {
  if (data.value !== undefined) {
    const urlResult = urlSchema.safeParse(data.value);
    if (!urlResult.success) {
      return ctx.addIssue({
        path: ['value'],
        code: z.ZodIssueCode.custom,
        message: (urlResult.error.cause as string) || 'Invalid url format',
      });
    }
  }

  return true;
};
