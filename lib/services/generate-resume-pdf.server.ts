import { toResume } from '@/lib/adapters/resume.adapter';
import { uploadResumePdfBytes } from '@/lib/clients/media.server';
import { getServerGraphqlSdk } from '@/lib/graphql/server-sdk';
import { unwrapCollection } from '@/lib/query/base-query';
import { resumePdfFilename } from '@/lib/resume-filename';
import { generateResumePdfBytes } from '@/lib/services/resume-pdf.server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
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
  return new GeneratePdfError(message, status);
}

async function loadResume(resumeId: string): Promise<Resume> {
  const sdk = await getServerGraphqlSdk();
  const data = await sdk.ResumeById({ id: resumeId });
  const row = unwrapCollection(data.resumesCollection)[0];
  if (!row) {
    throw new GeneratePdfError('Resume not found', 404);
  }
  return toResume(row);
}

export async function generateAndChargeResumePdf(resumeId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new GeneratePdfError('Please sign in', 401);
  }

  const resume = await loadResume(resumeId);
  if (resume.media?.url) {
    return {
      url: resume.media.url,
      key: resume.media.key,
    };
  }

  const { data: existingUrl, error: peekError } = await supabase.rpc('generate_pdf', {
    p_resume_id: resumeId,
  });
  if (peekError) {
    throw mapRpcError(peekError);
  }
  if (existingUrl) {
    return { url: existingUrl as string, key: resume.media?.key ?? '' };
  }

  const template = findTemplate(resume.template);
  if (!template) {
    throw new GeneratePdfError('Template not found', 400);
  }

  const bytes = await generateResumePdfBytes(resume.metadata, template.template, {
    color: resume.color,
    fontSize: resume.fontSize,
    isPreview: false,
  });
  const uploaded = await uploadResumePdfBytes(user.id, resumePdfFilename(resume.name), bytes);

  const { data: chargedUrl, error: finalizeError } = await supabase.rpc('finalize_pdf', {
    p_resume_id: resumeId,
    p_pdf_url: uploaded.url,
    p_pdf_media_key: uploaded.key,
  });
  if (finalizeError) {
    throw mapRpcError(finalizeError);
  }

  return {
    url: (chargedUrl as string) || uploaded.url,
    key: uploaded.key,
  };
}
