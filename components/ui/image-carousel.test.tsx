import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

import { ImageCarousel, carouselSheetStyle } from './image-carousel';

afterEach(cleanup);

const IMAGES = ['blob:page-1', 'blob:page-2', 'blob:page-3'];

function sheets() {
  return Array.from(screen.getByTestId('image-carousel').children) as HTMLElement[];
}

describe('carouselSheetStyle', () => {
  it('puts the current page in front at full size', () => {
    expect(carouselSheetStyle(1, 1)).toEqual({ zIndex: 3, transform: 'translateX(0) scale(1)', opacity: 1 });
  });

  it('places next pages to the right and previous pages to the left, smaller and lighter per step', () => {
    const next = carouselSheetStyle(2, 1);
    const previous = carouselSheetStyle(0, 1);
    expect(next.transform).toBe('translateX(calc(1 * (var(--carousel-peek) + 3%))) scale(0.94)');
    expect(previous.transform).toBe('translateX(calc(-1 * (var(--carousel-peek) + 3%))) scale(0.94)');
    expect(next.opacity).toBe(0.55);
    expect(next.zIndex).toBe(2);

    const twoAhead = carouselSheetStyle(2, 0);
    expect(twoAhead.transform).toBe('translateX(calc(2 * (var(--carousel-peek) + 3%))) scale(0.88)');
    expect(twoAhead.opacity).toBe(0.3);
    expect(twoAhead.zIndex).toBe(1);
  });

  it('hides pages more than two steps away at the second step, so they never peek out further', () => {
    const far = carouselSheetStyle(5, 0);
    expect(far.transform).toBe(carouselSheetStyle(2, 0).transform);
    expect(far.opacity).toBe(0);
  });
});

describe('ImageCarousel', () => {
  it('exposes only the page in front and hides the pages behind', () => {
    render(<ImageCarousel images={IMAGES} currentIndex={1} />);
    expect(screen.getAllByRole('img').map((image) => image.getAttribute('alt'))).toEqual(['PDF page 2']);
    const [first, second, third] = sheets();
    expect(second.dataset.current).toBe('true');
    expect(second.getAttribute('aria-hidden')).toBeNull();
    expect(first.getAttribute('aria-hidden')).toBe('true');
    expect(third.getAttribute('aria-hidden')).toBe('true');
    expect(Number(second.style.zIndex)).toBeGreaterThan(Number(first.style.zIndex));
  });

  it('moves the front page when the current index changes', () => {
    const { rerender } = render(<ImageCarousel images={IMAGES} currentIndex={0} />);
    expect(screen.getByRole('img').getAttribute('alt')).toBe('PDF page 1');
    rerender(<ImageCarousel images={IMAGES} currentIndex={2} />);
    expect(screen.getByRole('img').getAttribute('alt')).toBe('PDF page 3');
    expect(sheets()[2].style.transform).toBe('translateX(0) scale(1)');
    expect(sheets()[0].style.transform).toContain('scale(0.88)');
  });

  it('turns the slide off under reduced motion', () => {
    render(<ImageCarousel images={IMAGES} currentIndex={0} />);
    for (const sheet of sheets()) {
      expect(sheet.className).toContain('motion-reduce:transition-none');
    }
  });

  it('draws a one-page resume as a single page in front', () => {
    render(<ImageCarousel images={IMAGES.slice(0, 1)} currentIndex={0} />);
    expect(sheets()).toHaveLength(1);
    expect(sheets()[0].style.transform).toBe('translateX(0) scale(1)');
  });
});
