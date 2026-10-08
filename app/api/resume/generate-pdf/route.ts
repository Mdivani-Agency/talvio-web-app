import { z } from 'zod';

import {
  GeneratePdfError,
  generateAndChargeResumePdf,
} from '@/lib/services/generate-resume-pdf.server';
import { requireApiUser, unauthorizedResponse } from '@/lib/supabase/require-api-user';

const bodySchema = z.object({
  resumeId: z.string().uuid(),
});

export async function POST(request: Request) {
  let context;
  try {
    context = await requireApiUser(request);
  } catch (error) {
    return unauthorizedResponse(error) ?? Response.json({ error: 'Please sign in' }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: 'A resume id is required' }, { status: 400 });
  }

  try {
    const media = await generateAndChargeResumePdf(parsed.data.resumeId, context);
    return Response.json(media);
  } catch (error) {
    if (error instanceof GeneratePdfError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    const status = typeof error === 'object' && error && 'status' in error
      ? Number((error as { status: number }).status) || 500
      : 500;
    const message = error instanceof Error ? error.message : 'Failed to generate PDF';
    if (status >= 500) {
      console.error('generate-pdf failed', error);
    }
    return Response.json(
      { error: status >= 500 ? 'Failed to generate PDF' : message },
      { status },
    );
  }
}
