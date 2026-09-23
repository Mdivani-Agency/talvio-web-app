import { toResume } from '@/lib/adapters/resume.adapter';
import { uploadResumePdfBytes } from '@/lib/clients/media.server';
import { getServerGraphqlSdk } from '@/lib/graphql/server-sdk';
import { unwrapCollection } from '@/lib/query/base-query';
import { resumePdfFilename } from '@/lib/resume-filename';
import { generateResumePdfBytes } from '@/lib/services/resume-pdf.server';
import type { ApiUserContext } from '@/lib/supabase/require-api-user';
import { findTemplate } from '@/lib/templates';
import type { Resume } from '@lib/types';

export class GeneratePdfError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'GeneratePdfError';
    this.status = status;
  }
}

function rpcStatus(message: string) {
  const haystack = message.toLowerCase();
  if (haystack.includes('insufficient_credits')) {
    return 402;
  }
  if (haystack.includes('resume_not_found')) {
    return 404;
  }
  if (haystack.includes('not authenticated') || haystack.includes('invalid_user')) {
    return 401;
  }
  if (haystack.includes('invalid_pdf')) {
    return 400;
  }
  if (haystack.includes('resume_changed') || haystack.includes('resume_generation_in_progress')) {
    return 409;
  }
  return 500;
}

function mapRpcError(error: { message?: string }) {
  const message = error.message ?? 'Something went wrong';
  const status = rpcStatus(message);
  if (status === 402) {
    return new GeneratePdfError('Not enough credits', 402);
  }
  if (status === 404) {
    return new GeneratePdfError('Resume not found', 404);
  }
  if (status === 401) {
    return new GeneratePdfError('Please sign in', 401);
  }
  if (message.toLowerCase().includes('resume_changed')) {
    return new GeneratePdfError('This resume changed before the PDF was saved', 409);
  }
  if (message.toLowerCase().includes('resume_generation_in_progress')) {
    return new GeneratePdfError('A PDF is already being created for this resume', 409);
  }
  return new GeneratePdfError(message, status);
}

async function loadOwnedResume(resumeId: string, context: ApiUserContext): Promise<Resume> {
  const sdk = getServerGraphqlSdk(context.accessToken);
  const data = await sdk.ResumeById({ id: resumeId });
  const row = unwrapCollection(data.resumesCollection)[0];
  if (!row || row.user_id !== context.user.id) {
    throw new GeneratePdfError('Resume not found', 404);
  }
  return toResume(row);
}

async function releaseGenerationLock(resumeId: string, context: ApiUserContext) {
  const released = await context.supabase.rpc('release_resume_generation', {
    p_resume_id: resumeId,
  });
  if (released?.error) {
    console.error('release_resume_generation failed', released.error);
  }
}

export async function generateAndChargeResumePdf(
  resumeId: string,
  context: ApiUserContext,
) {
  const loaded = await loadOwnedResume(resumeId, context);
  if (loaded.media?.url) {
    return {
      url: loaded.media.url,
      key: loaded.media.key,
    };
  }

  let locked = false;
  try {
    const { data: existingUrl, error: peekError } = await context.supabase.rpc('generate_pdf', {
      p_resume_id: resumeId,
    });
    if (peekError) {
      throw mapRpcError(peekError);
    }
    if (existingUrl) {
      return { url: existingUrl as string, key: loaded.media?.key ?? '' };
    }

    locked = true;
    const resume = await loadOwnedResume(resumeId, context);
    const template = findTemplate(resume.template);
    if (!template) {
      throw new GeneratePdfError('Template not found', 400);
    }

    const bytes = await generateResumePdfBytes(resume.metadata, template.template, {
      color: resume.color,
      fontSize: resume.fontSize,
      isPreview: false,
    });
    const uploaded = await uploadResumePdfBytes(
      context.user.id,
      resumePdfFilename(resume.name),
      bytes,
    );

    const { data: chargedUrl, error: finalizeError } = await context.supabase.rpc('finalize_pdf', {
      p_resume_id: resumeId,
      p_pdf_url: uploaded.url,
      p_pdf_media_key: uploaded.key,
    });
    if (finalizeError) {
      throw mapRpcError(finalizeError);
    }
    locked = false;

    return {
      url: (chargedUrl as string) || uploaded.url,
      key: uploaded.key,
    };
  } catch (error) {
    if (locked) {
      await releaseGenerationLock(resumeId, context);
    }
    throw error;
  }
}
