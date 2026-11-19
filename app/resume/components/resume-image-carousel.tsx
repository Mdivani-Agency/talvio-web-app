import { Icon } from '@components/icons';
import { ImageCarousel } from '@components/ui';
import { cn } from '@lib/utils';

interface ResumeImageCarouselProps {
  images?: string[];
  isLoading: boolean;
  currentIndex: number;
  className?: string;
}

/** The preview pages at A4 ratio, sized to the stage's height, with a spinner while a new render loads. */
export function ResumeImageCarousel({ isLoading, images = [], currentIndex, className }: ResumeImageCarouselProps) {
  return (
    <div className={cn('relative aspect-[210/297]', className)}>
      {isLoading && (
        <div className="absolute top-0 left-0 z-10 flex h-full w-full items-center justify-center">
          <Icon type="Spinner" className="size-8 animate-spin text-primary-500" />
        </div>
      )}
      {images.length > 0 && <ImageCarousel className="block" currentIndex={currentIndex} images={images} />}
    </div>
  );
}
