import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TooltipProvider } from '@components/ui';

// The SVG icon set is a file import that jsdom cannot render.
vi.mock('@components/icons', () => ({ Icon: () => null }));

import { ResumeActionBar } from './resume-actions';

function renderBar(props: Partial<Parameters<typeof ResumeActionBar>[0]> = {}) {
  return render(
    <TooltipProvider>
      <ResumeActionBar
        color="#000000"
        imageCount={1}
        currentIndex={0}
        fontSize="md"
        onFontSizeChange={vi.fn()}
        setColor={vi.fn()}
        goToPrevious={vi.fn()}
        goToNext={vi.fn()}
        handleDownload={vi.fn()}
        handlePreviewOpen={vi.fn()}
        {...props}
      />
    </TooltipProvider>,
  );
}

describe('ResumeActionBar', () => {
  afterEach(() => cleanup());

  it('has no Improve with AI button without onImprove (flag off)', () => {
    renderBar();
    expect(screen.queryByRole('button', { name: 'Improve with AI' })).toBeNull();
  });

  it('starts Improve with AI and disables it while a session is open or there is no preview', () => {
    const onImprove = vi.fn();
    renderBar({ onImprove });
    fireEvent.click(screen.getByRole('button', { name: 'Improve with AI' }));
    expect(onImprove).toHaveBeenCalledTimes(1);
    cleanup();

    renderBar({ onImprove, improveDisabled: true });
    expect(screen.getByRole('button', { name: 'Improve with AI' }).hasAttribute('disabled')).toBe(true);
    cleanup();

    renderBar({ onImprove, imageCount: 0 });
    expect(screen.getByRole('button', { name: 'Improve with AI' }).hasAttribute('disabled')).toBe(true);
  });
});
