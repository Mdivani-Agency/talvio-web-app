import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PreviewToolbar } from './resume-actions';

afterEach(cleanup);

describe('PreviewToolbar', () => {
  it('pages through the preview and opens the full size view', () => {
    const goToPrevious = vi.fn();
    const goToNext = vi.fn();
    const handlePreviewOpen = vi.fn();
    render(
      <PreviewToolbar
        imageCount={3}
        currentIndex={1}
        goToPrevious={goToPrevious}
        goToNext={goToNext}
        handlePreviewOpen={handlePreviewOpen}
      />,
    );
    expect(screen.getByText('Page 2 of 3')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    fireEvent.click(screen.getByRole('button', { name: 'Full size' }));
    expect([goToPrevious, goToNext, handlePreviewOpen].map((fn) => fn.mock.calls.length)).toEqual([1, 1, 1]);
  });

  it('disables every control until the preview has a page', () => {
    render(
      <PreviewToolbar imageCount={0} currentIndex={0} goToPrevious={vi.fn()} goToNext={vi.fn()} handlePreviewOpen={vi.fn()} />,
    );
    for (const name of ['Previous page', 'Next page', 'Full size']) {
      expect(screen.getByRole('button', { name }).hasAttribute('disabled')).toBe(true);
    }
  });

  it('toggles Fit width with aria-pressed, shown only from lg', () => {
    const onFitWidthChange = vi.fn();
    const { rerender } = render(
      <PreviewToolbar
        imageCount={1}
        currentIndex={0}
        goToPrevious={vi.fn()}
        goToNext={vi.fn()}
        handlePreviewOpen={vi.fn()}
        fitWidth={false}
        onFitWidthChange={onFitWidthChange}
      />,
    );
    const toggle = screen.getByRole('button', { name: 'Fit width' });
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    expect(toggle.className).toContain('hidden');
    expect(toggle.className).toContain('lg:inline-flex');
    fireEvent.click(toggle);
    expect(onFitWidthChange).toHaveBeenLastCalledWith(true);

    rerender(
      <PreviewToolbar
        imageCount={1}
        currentIndex={0}
        goToPrevious={vi.fn()}
        goToNext={vi.fn()}
        handlePreviewOpen={vi.fn()}
        fitWidth
        onFitWidthChange={onFitWidthChange}
      />,
    );
    expect(screen.getByRole('button', { name: 'Fit width' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Fit width' }));
    expect(onFitWidthChange).toHaveBeenLastCalledWith(false);
  });

  it('leaves out Fit width without a handler', () => {
    render(
      <PreviewToolbar imageCount={1} currentIndex={0} goToPrevious={vi.fn()} goToNext={vi.fn()} handlePreviewOpen={vi.fn()} />,
    );
    expect(screen.queryByRole('button', { name: 'Fit width' })).toBeNull();
  });
});
