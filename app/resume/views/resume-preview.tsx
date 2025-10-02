'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { usePdfImage } from '@hooks/use-pdf-image';
import { resumeService } from '@lib/services/resume.service';
import { cn, debounce } from '@lib/utils';
import { Resume, ResumeDto, ResumeForm } from '@lib/types';
import { ResumeActionBar } from '../components/resume-actions';
import { ResumeImageCarousel } from '../components/resume-image-carousel';
import { useResumeContext } from '../providers/state-provider';
import { accountToResume, resumeToAccount } from '@lib/utils';
import { DownloadResumeModal, FullSizeResumeModal } from '@components/modals';
import { toast } from 'sonner';

interface PreviewProps {
  action?: React.ReactNode;
  className?: string;
  onDownload: () => Promise<Resume | undefined>;
}

export type RenderPreviewParams = Omit<ResumeDto, 'template' | 'resume'> & {
  metadata: ResumeForm;
}

export function Preview({ className, action, onDownload }: PreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFullSizeResumeModalOpen, setIsFullSizeResumeModalOpen] = useState(false);
  const [isDownloadResumeModalOpen, setIsDownloadResumeModalOpen] = useState(false);
  const { images, renderPDF } = usePdfImage();
  const { state, send } = useResumeContext();
  const { resumeDto, template } = state.context;
  const { resume, color, fontSize, template: templateKey } = resumeDto

  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex < images.length - 1 ? prevIndex + 1 : 0));
  };
  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : images.length - 1));
  };

  const downloadPdf = async () => {
    try {
    setIsGenerating(true);
    const res = await onDownload();

    const { media, name } = res || {};
    if (media && name) {
        const link = document.createElement('a');
        link.href = media.url;
        link.setAttribute('download', `${name}.pdf`);
        link.setAttribute('target', '_blank');
        link.click();
        link.remove();
      }
      setIsDownloadResumeModalOpen(false);
    } catch {
      toast.error('Failed to generate resume', {
        description: 'Please try again later',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const renderPreview = useCallback(async (dto: RenderPreviewParams) => {
    if (!template) return;

    const { metadata, color, fontSize } = dto;

    const response = await resumeService.generate(metadata, template, {
      color,
      fontSize,
      isPreview: true,
    });
    const blob = new Blob([response as unknown as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    renderPDF(url);
    send({ type: 'CHANGE_RESUME', value: { ...dto, resume: resumeToAccount(metadata), template: templateKey } });
  }, [template, templateKey, send, renderPDF]);

  const debouncedFetchPdf = useMemo(
    () =>
      debounce((params: RenderPreviewParams) => {
        renderPreview(params);
      }, 300),
    [renderPreview],
  );

  useEffect(() => {
    debouncedFetchPdf({ metadata: accountToResume(resume), color, fontSize, name: 'resume' });
  }, [resume, template, color, fontSize, debouncedFetchPdf]);

  return (
    <section className={cn('h-full flex', className)}>
      <section className={'relative w-full h-full overflow-y-auto'}>
        <ResumeImageCarousel isLoading={false} images={images} currentIndex={currentIndex} />
        <ResumeActionBar
          className="absolute bottom-10 left-0 right-0 z-30"
          color={color}
          action={action}
          setColor={(color) => send({ type: 'CHANGE_RESUME', value: { ...resumeDto, color } })}
          imageCount={images.length}
          currentIndex={currentIndex}
          goToPrevious={goToPrevious}
          goToNext={goToNext}
          fontSize={fontSize}
          onFontSizeChange={(fontSize) => send({ type: 'CHANGE_RESUME', value: { ...resumeDto, fontSize } })}
          handleDownload={() => setIsDownloadResumeModalOpen(true)}
          handlePreviewOpen={() => setIsFullSizeResumeModalOpen(true)}
        />
      </section>
      <FullSizeResumeModal
        isOpen={isFullSizeResumeModalOpen}
        urls={images}
        color={color}
        setColor={(color) => send({ type: 'CHANGE_RESUME', value: { ...resumeDto, color } })}
        onClose={() => setIsFullSizeResumeModalOpen(false)}
        onDownload={() => setIsDownloadResumeModalOpen(true)}
      />
      <DownloadResumeModal
        isOpen={isDownloadResumeModalOpen}
        filename={resumeDto.name}
        isGenerating={isGenerating}
        setFilename={(name) => send({ type: 'CHANGE_RESUME', value: { ...resumeDto, name } })}
        generateResume={downloadPdf}
        onClose={() => setIsDownloadResumeModalOpen(false)}
      />
    </section>
  );
}
