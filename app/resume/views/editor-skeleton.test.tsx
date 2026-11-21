import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// The logo's SVG module does not load in jsdom.
vi.mock('@components/icons', () => ({ Icon: () => null }));

import { EditorSkeleton } from './editor-skeleton';

afterEach(cleanup);

describe('EditorSkeleton (MDI-671)', () => {
  it('keeps the logo and draws the section list and the page in grey under one status line', () => {
    render(<EditorSkeleton />);
    expect(screen.getByRole('status').textContent).toBe('Opening your resume');
    expect(screen.getByRole('link').getAttribute('href')).toBe('/');
    const shapes = screen.getByTestId('page-skeleton');
    expect(shapes.getAttribute('aria-hidden')).toBe('true');
    // Six section bars and the A4 page.
    expect(shapes.querySelectorAll('span')).toHaveLength(7);
  });
});
