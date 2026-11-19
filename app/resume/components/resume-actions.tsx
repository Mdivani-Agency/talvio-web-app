'use client';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

import { Button } from '@components/ui';
import { cn } from '@lib/utils/tailwind';
import { FULL_SIZE_LABEL, NEXT_PAGE, PREVIOUS_PAGE, pageOfText } from '@/lib/resume-editor-copy';

type PreviewToolbarProps = {
  imageCount: number;
  currentIndex: number;
  className?: string;
  goToPrevious: () => void;
  goToNext: () => void;
  handlePreviewOpen: () => void;
};

/** Under the preview: Previous page, "Page x of y", Next page and Full size. */
export const PreviewToolbar = ({
  imageCount,
  currentIndex,
  className,
  goToPrevious,
  goToNext,
  handlePreviewOpen,
}: PreviewToolbarProps) => {
  const empty = imageCount === 0;
  return (
    <div
      className={cn(
        'flex flex-none items-center gap-1 rounded-[1.2rem] bg-background p-1 shadow-[0_2px_8px_rgba(13,13,13,0.12)]',
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        className="size-[4.4rem] p-0"
        aria-label={PREVIOUS_PAGE}
        onClick={goToPrevious}
        disabled={empty}
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
      </Button>
      <span aria-live="polite" className="min-w-[9.6rem] text-center text-sm font-medium">
        {pageOfText(empty ? 0 : currentIndex + 1, imageCount)}
      </span>
      <Button
        type="button"
        variant="ghost"
        className="size-[4.4rem] p-0"
        aria-label={NEXT_PAGE}
        onClick={goToNext}
        disabled={empty}
      >
        <ChevronRight aria-hidden="true" className="size-4" />
      </Button>
      <span aria-hidden="true" className="mx-1 h-6 w-px bg-border" />
      <Button type="button" variant="ghost" className="h-[4.4rem] px-3" disabled={empty} onClick={handlePreviewOpen}>
        <Maximize2 aria-hidden="true" className="size-4" />
        {FULL_SIZE_LABEL}
      </Button>
    </div>
  );
};
