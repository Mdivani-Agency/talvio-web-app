import { isGeneratedResume } from '@/lib/adapters/resume.adapter';
import { GENERATE_PDF_CREDITS } from '@/lib/credits';
import { savePdf, type PdfFile } from '@/lib/pdf/save-pdf';
import { PDF_ACTION_MESSAGES } from '@/lib/resume-editor-copy';
import { authedFetch } from '@/lib/supabase/authed-fetch';
import type { Resume } from '@lib/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { fetchResume } from './use-resume';

export { GENERATE_PDF_CREDITS };

/** The resume's stored PDF, for Download and Open; undefined until it has one. */
export function resumePdfFile(resume: Pick<Resume, 'media' | 'name'>): PdfFile | undefined {
  return resume.media?.url ? { url: resume.media.url, name: resume.name } : undefined;
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

type GenerateResumePdfOptions = {
  /** Called after a newly generated PDF exists (and is saved, with `save`); not after a free re-download. */
  onNewPdf?: (resume: Resume) => void;
  /**
   * Save the PDF once it exists (default). The editor passes false and offers Download and Open in its dialog instead,
   * because a save started seconds after the click can no longer ask where to save.
   */
  save?: boolean;
};

export function useGenerateResumePdf(userId?: string, { onNewPdf, save = true }: GenerateResumePdfOptions = {}) {
  const queryClient = useQueryClient();

  const refreshGenerated = async (resume: Resume) => {
    await queryClient.invalidateQueries({ queryKey: ['resume', resume.id] });
    await queryClient.invalidateQueries({ queryKey: ['resume-family'] });
    await queryClient.invalidateQueries({ queryKey: ['resumes', userId] });
    await queryClient.invalidateQueries({ queryKey: ['credits', userId] });
    await queryClient.invalidateQueries({ queryKey: ['documents', userId] });
  };

  return useMutation({
    mutationFn: async (resume: Resume) => {
      const { resume: saved, generated } = await generatePdfFile(resume);
      if (generated) {
        onNewPdf?.(saved);
      }
      if (save) {
        const file = resumePdfFile(saved);
        try {
          if (!file) {
            throw new Error('Resume PDF was not created');
          }
          await savePdf(file);
        } catch {
          // The PDF exists and was charged; only the save on this device failed. Show the generated state before
          // reporting it, so the page does not offer Generate again.
          await refreshGenerated(saved);
          throw new Error(PDF_ACTION_MESSAGES.failed);
        }
      }
      return saved;
    },
    onSuccess: refreshGenerated,
    // A refused generation means the balance changed elsewhere; show the real count.
    onError: () => queryClient.invalidateQueries({ queryKey: ['credits', userId] }),
  });
}
