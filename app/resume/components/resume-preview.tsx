'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { usePdfImage } from '@hooks/use-pdf-image';
import { resumeService } from '@lib/services/resume.service';
import { cn, debounce } from '@lib/utils';
import { ResumeDto, ResumeForm } from '@lib/types';
import { ResumeActionBar } from './resume-actions';
import { ResumeImageCarousel } from './resume-image-carousel';
import { FullSizeResumeModal } from '@components/modals';
import { Template } from '@pdf-tlv/resume';

interface ResumePreviewProps {
  action?: React.ReactNode;
  className?: string;
  template: Template | null;
  resume: ResumeForm
  fontSize: 'sm' | 'md' | 'lg';
  color: string;
  handleChange: (key: 'color' | 'fontSize' | 'name', value: string) => void;
  onDownload: () => void;
}

export type RenderPreviewParams = Omit<ResumeDto, 'template' | 'resume'> & {
  metadata: ResumeForm;
}

export function ResumePreview({ className, action, template, resume, fontSize, color, onDownload, handleChange }: ResumePreviewProps) {
  const [isFullSizeResumeModalOpen, setIsFullSizeResumeModalOpen] = useState(false);
  const { images, renderPDF } = usePdfImage();

  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex < images.length - 1 ? prevIndex + 1 : 0));
  };
  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : images.length - 1));
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
  }, [template, renderPDF]);

  const debouncedFetchPdf = useMemo(
    () =>
      debounce((params: RenderPreviewParams) => {
        renderPreview(params);
      }, 300),
    [renderPreview],
  );

  useEffect(() => {
    debouncedFetchPdf({ metadata: resume, color, fontSize, name: 'resume' });
  }, [resume, template, color, fontSize, debouncedFetchPdf]);

  return (
    <section className={cn('h-full flex', className)}>
      <section className={'relative w-full h-full overflow-y-auto'}>
        <ResumeImageCarousel isLoading={false} images={images} currentIndex={currentIndex} />
        <ResumeActionBar
          className="absolute bottom-10 left-0 right-0 z-30"
          color={color}
          action={action}
          setColor={(color) => handleChange('color', color)}
          imageCount={images.length}
          currentIndex={currentIndex}
          goToPrevious={goToPrevious}
          goToNext={goToNext}
          fontSize={fontSize}
          onFontSizeChange={(fontSize) => handleChange('fontSize', fontSize)}
          handleDownload={() => onDownload()}
          handlePreviewOpen={() => setIsFullSizeResumeModalOpen(true)}
        />
      </section>
      <FullSizeResumeModal
        isOpen={isFullSizeResumeModalOpen}
        urls={images}
        color={color}
        setColor={(color) => handleChange('color', color)}
        onClose={() => setIsFullSizeResumeModalOpen(false)}
        onDownload={() => onDownload()}
      />
    </section>
  );
}
