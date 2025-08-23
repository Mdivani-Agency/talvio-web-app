import { Icon } from '@components/icons';
import { ImageCarousel } from '@components/ui';

interface ResumeImageCarouselProps {
  images?: string[];
  isLoading: boolean;
  currentIndex: number;
}

export function ResumeImageCarousel({ isLoading, images = [], currentIndex }: ResumeImageCarouselProps) {

  return (
    <div className={'relative w-full h-full'}>
      {isLoading && (
        <div className={'hidden absolute top-0 left-0 z-10 w-full h-full flex items-center justify-center md:flex'}>
          <div className={'absolute top-0 left-0 w-full h-full opacity-50'} />
          <Icon type={'Spinner'} className={'size-8 text-primary-500 animate-spin'} />
        </div>
      )}
      {images.length > 0 && <ImageCarousel currentIndex={currentIndex} images={images} />}
    </div>
  );
}
