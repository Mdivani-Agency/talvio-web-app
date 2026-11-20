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

/** The resume with its PDF, and whether this call created a new PDF (`false` for a free re-download). */
export type GeneratedPdf = { resume: Resume; generated: boolean };

export async function generatePdfFile(resume: Resume): Promise<GeneratedPdf> {
  if (isGeneratedResume(resume) && resume.media?.url) {
    return { resume, generated: false };
  }

  try {
    const response = await authedFetch('/api/resume/generate-pdf', {
      method: 'POST',
      body: JSON.stringify({ resumeId: resume.id }),
    });

    let payload: { error?: string; url?: string; key?: string; generated?: boolean } = {};
    try {
      payload = (await response.json()) as typeof payload;
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
      resume: {
        ...resume,
        media: { url: payload.url, key: payload.key || resume.media?.key || '' },
      },
      generated: payload.generated === true,
    };
  } catch (error) {
    // A dropped response can arrive after finalize already stored the file.
    try {
      const fresh = await fetchResume(resume.id);
      if (isGeneratedResume(fresh) && fresh.media?.url) {
        // Unknown whether this call created it; a lost response does not open the review prompt.
        return { resume: fresh, generated: false };
      }
    } catch {
      // Keep the original failure so a real credit or render error stays visible.
    }
    throw error;
  }
}

export async function generateAndPersistPdf(resume: Resume): Promise<Resume> {
  return (await generatePdfFile(resume)).resume;
}

export async function downloadPdfFile(resume: Resume): Promise<GeneratedPdf> {
  const result = await generatePdfFile(resume);
  if (!result.resume.media?.url) {
    throw new Error('Resume PDF was not created');
  }
  triggerBrowserDownload(result.resume.media.url, result.resume.name);
  return result;
}

export async function downloadResumePdf(resume: Resume): Promise<Resume> {
  return (await downloadPdfFile(resume)).resume;
}

type GenerateResumePdfOptions = {
  /** Called after the download of a newly generated PDF has started; not after a free re-download. */
  onNewPdf?: (resume: Resume) => void;
};

export function useGenerateResumePdf(userId?: string, { onNewPdf }: GenerateResumePdfOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resume: Resume) => {
      const { resume: saved, generated } = await downloadPdfFile(resume);
      if (generated) {
        onNewPdf?.(saved);
      }
      return saved;
    },
    onSuccess: async (resume) => {
      await queryClient.invalidateQueries({ queryKey: ['resume', resume.id] });
      await queryClient.invalidateQueries({ queryKey: ['resume-family'] });
      await queryClient.invalidateQueries({ queryKey: ['resumes', userId] });
      await queryClient.invalidateQueries({ queryKey: ['credits', userId] });
      await queryClient.invalidateQueries({ queryKey: ['documents', userId] });
    },
    // A refused generation means the balance changed elsewhere; show the real count.
    onError: () => queryClient.invalidateQueries({ queryKey: ['credits', userId] }),
  });
}
