'use client';
import { useState } from 'react';

import { Button } from '@components/ui';
import { FullSizeResumeModal } from '@components/modals';
import { cn } from '@lib/utils';
import type { ResumeForm, TemplateKey } from '@lib/types';
import { pageCountText, previewCaption } from '@/lib/resume-editor-copy';

import { useResumePreview } from '../hooks/use-resume-preview';
import { PreviewToolbar } from './resume-actions';
import { ResumeImageCarousel } from './resume-image-carousel';

interface ResumePreviewProps {
  className?: string;
  templateKey: TemplateKey;
  /** The template's display name for the caption, such as "Modern". */
  templateName: string;
  resume: ResumeForm;
  fontSize: 'sm' | 'md' | 'lg';
  color: string;
  handleChange: (key: 'color' | 'fontSize', value: string) => void;
  onDownload: () => void;
  readOnly?: boolean;
}

/**
 * The preview stage: the caption and page count, the current page, and the toolbar under it. The page fits the
 * stage's height, so the toolbar stays on screen.
 */
export function ResumePreview({
  className,
  templateKey,
  templateName,
  resume,
  fontSize,
  color,
  onDownload,
  handleChange,
  readOnly = false,
}: ResumePreviewProps) {
  const [isFullSizeResumeModalOpen, setIsFullSizeResumeModalOpen] = useState(false);
  const { images, isLoading, error, pageIndex, retry, goToNext, goToPrevious } = useResumePreview({
    resume,
    templateKey,
    color,
    fontSize,
  });

  return (
    <section
      aria-label={previewCaption(templateName)}
      className={cn('relative flex min-h-0 flex-col items-center gap-4 bg-accent p-4 md:px-10 md:py-5', className)}
    >
      <p data-allow-small-text className="hidden w-full justify-between text-[1.3rem] text-muted-foreground md:flex">
        <span>{previewCaption(templateName)}</span>
        <span>{images.length > 0 ? pageCountText(images.length) : null}</span>
      </p>
      <div className="relative flex min-h-0 w-full flex-1 items-start justify-center">
        <ResumeImageCarousel
          className="max-h-full w-full max-w-full md:h-full md:w-auto"
          isLoading={isLoading}
          images={images}
          currentIndex={pageIndex}
        />
        {error ? (
          <div className="absolute top-4 right-0 left-0 z-20 flex justify-center px-4">
            <div className="flex items-center gap-2 rounded-md bg-popover px-3 py-2 text-sm shadow-md">
              <span>{error}</span>
              <Button type="button" variant="link" size="sm" className="px-0" onClick={retry}>
                Retry
              </Button>
            </div>
          </div>
        ) : null}
      </div>
      <PreviewToolbar
        imageCount={images.length}
        currentIndex={pageIndex}
        goToPrevious={goToPrevious}
        goToNext={goToNext}
        handlePreviewOpen={() => setIsFullSizeResumeModalOpen(true)}
      />
      <FullSizeResumeModal
        isOpen={isFullSizeResumeModalOpen}
        urls={images}
        color={color}
        setColor={(nextColor) => {
          if (!readOnly) {
            handleChange('color', nextColor);
          }
        }}
        onClose={() => setIsFullSizeResumeModalOpen(false)}
        onDownload={() => onDownload()}
      />
    </section>
  );
}
