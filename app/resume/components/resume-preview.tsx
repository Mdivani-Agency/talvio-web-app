'use client';
import { useState } from 'react';

import { Button } from '@components/ui';
import { FullSizeResumeModal } from '@components/modals';
import { cn } from '@lib/utils';
import type { ResumeForm, TemplateKey } from '@lib/types';
import { pageCountText, previewCaption } from '@/lib/resume-editor-copy';

import { usePreviewFitWidth } from '../hooks/use-preview-fit-width';
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
 * The preview stage: the caption and page count, the current page, and the toolbar under it. By default the page fits
 * the stage's height, so the whole page and the toolbar stay on screen. With Fit width on (from `lg` only) the page
 * fills the stage's width, up to A4 at real size (794px), and the page area scrolls while the toolbar stays pinned.
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
  const { fitWidth, setFitWidth } = usePreviewFitWidth();
  const { images, isLoading, error, pageIndex, retry, goToNext, goToPrevious } = useResumePreview({
    resume,
    templateKey,
    color,
    fontSize,
  });

  return (
    <section
      aria-label={previewCaption(templateName)}
      data-fit-width={fitWidth || undefined}
      className={cn(
        // `overflow-x-clip`: the pages behind the current one peek into the side padding and never cause a scrollbar.
        'relative flex min-h-0 flex-col items-center gap-4 overflow-x-clip bg-accent p-4 md:px-10 md:py-5',
        // `cqw` below measures the stage's content width, so a scrollbar does not shrink the page.
        fitWidth && 'lg:@container',
        className,
      )}
    >
      <p data-allow-small-text className="hidden w-full justify-between text-[1.3rem] text-muted-foreground md:flex">
        <span>{previewCaption(templateName)}</span>
        <span>{images.length > 0 ? pageCountText(images.length) : null}</span>
      </p>
      <div
        data-testid="preview-page-area"
        className={cn(
          'relative flex min-h-0 w-full flex-1 items-start justify-center',
          // Reaches into the stage's side padding, so the scrollbar sits there and not over the page.
          fitWidth && 'lg:-mx-10 lg:w-[calc(100%+8rem)] lg:overflow-x-hidden lg:overflow-y-auto lg:px-10',
        )}
      >
        <ResumeImageCarousel
          className={cn(
            'max-h-full w-full max-w-full md:h-full md:w-auto',
            // The page is drawn at 98% of this box (`.a4-container`), so the box is a little wider than the page.
            fitWidth && 'lg:h-auto lg:max-h-none lg:w-[calc(min(100cqw,79.4rem)/0.98)] lg:max-w-none lg:flex-none',
          )}
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
        fitWidth={fitWidth}
        onFitWidthChange={setFitWidth}
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
