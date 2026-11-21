import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SkeletonBlock, SkeletonShapes, SkeletonStatus } from './page-skeleton';

afterEach(cleanup);

describe('page skeleton', () => {
  it('announces the status line and hides the grey shapes from assistive technology', () => {
    render(
      <>
        <SkeletonStatus label="Loading your account" />
        <SkeletonShapes>
          <SkeletonBlock className="h-8" />
          <SkeletonBlock tone="card" className="h-24" />
        </SkeletonShapes>
      </>,
    );
    expect(screen.getByRole('status').textContent).toBe('Loading your account');
    const shapes = screen.getByTestId('page-skeleton');
    expect(shapes.getAttribute('aria-hidden')).toBe('true');
    // The pulse stops under reduced motion.
    expect(shapes.className).toContain('motion-reduce:animate-none');
    expect(shapes.children).toHaveLength(2);
  });
});
