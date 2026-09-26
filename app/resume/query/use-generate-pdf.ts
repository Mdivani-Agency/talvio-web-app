import { isGeneratedResume } from '@/lib/adapters/resume.adapter';
import { GENERATE_PDF_CREDITS } from '@/lib/credits';
import { authedFetch } from '@/lib/supabase/authed-fetch';
import type { Resume } from '@lib/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { fetchResume } from './use-resume';

export { GENERATE_PDF_CREDITS };

export function triggerBrowserDownload(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
  link.setAttribute('target', '_blank');
  link.rel = 'noopener noreferrer';
  link.click();
  link.remove();
}

export async function generateAndPersistPdf(resume: Resume): Promise<Resume> {
  if (isGeneratedResume(resume) && resume.media?.url) {
    return resume;
  }

  try {
    const response = await authedFetch('/api/resume/generate-pdf', {
      method: 'POST',
      body: JSON.stringify({ resumeId: resume.id }),
    });

    let payload: { error?: string; url?: string; key?: string } = {};
    try {
      payload = (await response.json()) as { error?: string; url?: string; key?: string };
    } catch {
      payload = {};
    }

    if (!response.ok) {
      throw new Error(payload.error || 'Failed to generate PDF');
    }
    if (!payload.url) {
      throw new Error('Resume PDF was not created');
    }

    return {
      ...resume,
      media: { url: payload.url, key: payload.key || resume.media?.key || '' },
    };
  } catch (error) {
    // A dropped response can arrive after finalize already stored the file.
    try {
      const fresh = await fetchResume(resume.id);
      if (isGeneratedResume(fresh) && fresh.media?.url) {
        return fresh;
      }
    } catch {
      // Keep the original failure so a real credit or render error stays visible.
    }
    throw error;
  }
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
      await queryClient.invalidateQueries({ queryKey: ['resume-family'] });
      await queryClient.invalidateQueries({ queryKey: ['resumes', userId] });
      await queryClient.invalidateQueries({ queryKey: ['credits', userId] });
      await queryClient.invalidateQueries({ queryKey: ['documents', userId] });
    },
  });
}
