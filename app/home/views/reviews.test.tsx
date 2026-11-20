import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { TrustpilotReview } from '@/lib/reviews-copy';

import { Reviews } from './reviews';

const reviews: TrustpilotReview[] = [1, 2, 3].map((n) => ({
  text: `Quote number ${n}. Quoted as written.`,
  name: `Reviewer ${n}`,
  date: `2026-11-0${n}`,
  url: `https://www.trustpilot.com/reviews/review-${n}`,
}));

describe('Reviews', () => {
  afterEach(() => cleanup());

  it('renders nothing without reviews', () => {
    const { container } = render(<Reviews reviews={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows each quote with its name and a link to that review', () => {
    render(<Reviews reviews={reviews} />);

    const section = screen.getByRole('region', { name: 'What people say about Talvio' });
    expect(within(section).getByText('Reviews')).toBeTruthy();
    const items = within(section).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    items.forEach((item, index) => {
      const n = index + 1;
      expect(item.querySelector('blockquote')?.textContent).toBe(`“Quote number ${n}. Quoted as written.”`);
      expect(within(item).getByText(`Reviewer ${n}`)).toBeTruthy();
      const link = within(item).getByRole('link', { name: new RegExp(`Reviewed on Trustpilot · ${n} November 2026`) });
      expect(link.getAttribute('href')).toBe(`https://www.trustpilot.com/reviews/review-${n}`);
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    });
  });

  it('links to every review on Trustpilot and says they are selected', () => {
    render(<Reviews reviews={reviews} />);

    const all = screen.getByRole('link', { name: /Read all reviews on Trustpilot/ });
    expect(all.getAttribute('href')).toBe('https://www.trustpilot.com/review/talvio.co');
    expect(all.getAttribute('target')).toBe('_blank');
    expect(
      screen.getByText('Selected reviews, quoted as written. See every review, including critical ones, on Trustpilot.'),
    ).toBeTruthy();
  });

  it('shows no stars, scores or Trustpilot images', () => {
    const { container } = render(<Reviews reviews={reviews} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).not.toMatch(/★|TrustScore|stars?\b|rating/i);
  });
});
