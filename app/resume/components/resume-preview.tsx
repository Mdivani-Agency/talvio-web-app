'use client';
import { useState } from 'react';

import { Button } from '@components/ui';
import { FullSizeResumeModal } from '@components/modals';
import { cn } from '@lib/utils';
import type { ResumeForm, TemplateKey } from '@lib/types';

import { useResumePreview } from '../hooks/use-resume-preview';
import { ResumeActionBar } from './resume-actions';
import { ResumeImageCarousel } from './resume-image-carousel';

interface ResumePreviewProps {
  action?: React.ReactNode;
  className?: string;
  templateKey: TemplateKey;
  resume: ResumeForm
  fontSize: 'sm' | 'md' | 'lg';
  color: string;
  handleChange: (key: 'color' | 'fontSize', value: string) => void;
  onDownload: () => void;
  readOnly?: boolean;
}

export function ResumePreview({
  className,
  action,
  templateKey,
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
    <section className={cn('h-full flex', className)}>
      <section className={'relative w-full h-full overflow-y-auto'}>
        <ResumeImageCarousel isLoading={isLoading} images={images} currentIndex={pageIndex} />
        {error ? (
          <div className="absolute top-4 left-0 right-0 z-20 flex justify-center px-4">
            <div className="flex items-center gap-2 rounded-md bg-popover px-3 py-2 text-sm shadow-md">
              <span>{error}</span>
              <Button type="button" variant="link" size="sm" className="px-0" onClick={retry}>
                Retry
              </Button>
            </div>
          </div>
        ) : null}
        <ResumeActionBar
          className="absolute bottom-10 left-0 right-0 z-30"
          color={color}
          action={action}
          setColor={(nextColor) => {
            if (!readOnly) {
              handleChange('color', nextColor);
            }
          }}
          imageCount={images.length}
          currentIndex={pageIndex}
          goToPrevious={goToPrevious}
          goToNext={goToNext}
          fontSize={fontSize}
          onFontSizeChange={(nextFontSize) => {
            if (!readOnly) {
              handleChange('fontSize', nextFontSize);
            }
          }}
          disabled={readOnly}
          handleDownload={() => onDownload()}
          handlePreviewOpen={() => setIsFullSizeResumeModalOpen(true)}
        />
      </section>
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
