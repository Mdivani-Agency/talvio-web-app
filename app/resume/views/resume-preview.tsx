'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Template } from '@pdf-tlv/resume';

import { usePdfImage } from '@hooks/use-pdf-image';
import { resumeService } from '@lib/services/resume.service';
import { RESUME_COLORS_MAP, cn, debounce } from '@lib/utils';
import { ResumeDto, ResumeForm } from '@lib/types';
import { ResumeActionBar } from './resume-actions';
import { ResumeImageCarousel } from './resume-image-carousel';

interface PreviewProps {
  data: ResumeForm;
  template?: Template;
  action?: React.ReactNode;
  className?: string;
  onDownload: (args: { name: string; color: string; fontSize: string }) => Promise<{ url: string }>;
}

export type RenderPreviewParams = Omit<ResumeDto, 'template' | 'resume'> & {
  resume: ResumeForm;
}

export function Preview({ template, data, className, action }: PreviewProps) {
  const { images, renderPDF } = usePdfImage();
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [color, setColor] = useState<string>(
    RESUME_COLORS_MAP[template as unknown as keyof typeof RESUME_COLORS_MAP] || RESUME_COLORS_MAP.black,
  );
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
    debouncedFetchPdf({ resume: data, color, fontSize, name: 'resume' });
  }, [data, template, color, fontSize, debouncedFetchPdf]);

  return (
    <section className={cn('h-full flex', className)}>
      <section className={'relative w-full h-full overflow-y-auto'}>
        <ResumeImageCarousel isLoading={false} images={images} currentIndex={currentIndex} />
        <ResumeActionBar
          className="absolute bottom-10 left-0 right-0 z-30"
          color={color}
          action={action}
          setColor={setColor}
          imageCount={images.length}
          currentIndex={currentIndex}
          goToPrevious={goToPrevious}
          goToNext={goToNext}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          handleDownload={() => {}}
          handlePreviewOpen={() => {}}
        />
      </section>
    </section>
  );
}
