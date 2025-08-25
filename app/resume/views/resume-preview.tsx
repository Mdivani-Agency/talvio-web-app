'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { usePdfImage } from '@hooks/use-pdf-image';
import { resumeService } from '@lib/services/resume.service';
import { cn, debounce } from '@lib/utils';
import { ResumeDto, ResumeForm } from '@lib/types';
import { ResumeActionBar } from './resume-actions';
import { ResumeImageCarousel } from './resume-image-carousel';
import { useResumeContext } from '../providers/state-provider';
import { accountToResume } from '@lib/utils';
import { FullSizeResumeModal } from '@components/modals';

interface PreviewProps {
  action?: React.ReactNode;
  className?: string;
  onDownload: (args: { name: string; color: string; fontSize: string }) => Promise<{ url: string }>;
}

export type RenderPreviewParams = Omit<ResumeDto, 'template' | 'resume'> & {
  resume: ResumeForm;
}

export function Preview({ className, action }: PreviewProps) {
  const [isFullSizeResumeModalOpen, setIsFullSizeResumeModalOpen] = useState(false);
  const { images, renderPDF } = usePdfImage();
  const { state, send } = useResumeContext();
  const { resumeDto, template } = state.context;
  const { resume, color, fontSize } = resumeDto

  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex < images.length - 1 ? prevIndex + 1 : 0));
  };
  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : images.length - 1));
  };

  const renderPreview = useCallback(async (dto: RenderPreviewParams) => {
    if (!template) return;

    const { resume, color, fontSize } = dto;

    const response = await resumeService.generate(resume, template, {
      color,
      fontSize,
      isPreview: true,
    });
    const blob = new Blob([response], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    renderPDF(url);
  }, [template, renderPDF]);

  const debouncedFetchPdf = useMemo(
    () =>
      debounce((params: RenderPreviewParams) => {
        renderPreview(params);
      }, 300),
    [renderPreview],
  );

  useEffect(() => {
    debouncedFetchPdf({ resume: accountToResume(resume), color, fontSize, name: 'resume' });
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
          handleDownload={() => {}}
          handlePreviewOpen={() => setIsFullSizeResumeModalOpen(true)}
        />
      </section>
      <FullSizeResumeModal
        isOpen={isFullSizeResumeModalOpen}
        urls={images}
        color={color}
        setColor={(color) => send({ type: 'CHANGE_RESUME', value: { ...resumeDto, color } })}
        onClose={() => setIsFullSizeResumeModalOpen(false)}
        onDownload={() => {}}
      />
    </section>
  );
}
