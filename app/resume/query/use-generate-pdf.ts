import { isGeneratedResume } from '@/lib/adapters/resume.adapter';
import { uploadResumePdf } from '@/lib/clients/media.client';
import { GENERATE_PDF_CREDITS } from '@/lib/credits';
import { getGraphqlSdk, parseGraphqlError } from '@/lib/graphql-client';
import { generateResumePdf } from '@/lib/services/resume.service';
import { findTemplate } from '@/lib/templates';
import type { Resume } from '@lib/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { persistResumePdf } from './use-persist-resume-pdf';

export { GENERATE_PDF_CREDITS };

function safeFilename(name: string) {
  const trimmed = name.trim() || 'resume';
  return `${trimmed.replace(/[^\w.\- ]+/g, '')}.pdf`;
}

export function triggerBrowserDownload(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
  link.setAttribute('target', '_blank');
  link.rel = 'noopener noreferrer';
  link.click();
  link.remove();
}

export async function renderFinalResumePdf(resume: Resume): Promise<Blob> {
  const template = findTemplate(resume.template);
  if (!template) {
    throw new Error('Template not found');
  }
  return generateResumePdf(resume.metadata, template.template, {
    color: resume.color,
    fontSize: resume.fontSize,
    isPreview: false,
  });
}

export async function generateAndPersistPdf(resume: Resume): Promise<Resume> {
  if (isGeneratedResume(resume) && resume.media?.url) {
    return resume;
  }

  const sdk = await getGraphqlSdk();
  let existingUrl = '';
  try {
    const data = await sdk.Generate_Pdf({ p_resume_id: resume.id });
    existingUrl = data.generate_pdf ?? '';
  } catch (error) {
    throw new Error(parseGraphqlError(error));
  }

  if (existingUrl) {
    return {
      ...resume,
      media: { url: existingUrl, key: resume.media?.key || '' },
    };
  }

  const blob = await renderFinalResumePdf(resume);
  const uploaded = await uploadResumePdf(safeFilename(resume.name), blob);
  return persistResumePdf(resume.id, uploaded);
}

export async function downloadResumePdf(resume: Resume): Promise<Resume> {
  const generated = await generateAndPersistPdf(resume);
  if (!generated.media?.url) {
    throw new Error('Resume PDF was not created');
  }
  triggerBrowserDownload(generated.media.url, generated.name);
  return generated;
}

export function useGenerateResumePdf(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: downloadResumePdf,
    onSuccess: async (resume) => {
      await queryClient.invalidateQueries({ queryKey: ['resume', resume.id] });
      await queryClient.invalidateQueries({ queryKey: ['resumes', userId] });
      await queryClient.invalidateQueries({ queryKey: ['credits', userId] });
      await queryClient.invalidateQueries({ queryKey: ['documents', userId] });
    },
  });
}
