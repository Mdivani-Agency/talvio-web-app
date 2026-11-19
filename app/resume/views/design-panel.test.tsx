import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({ default: () => null }));

import { listResumeTemplates } from '@lib/templates';
import { RESUME_COLORS_MAP } from '@lib/utils';

import { DesignPanel, nextRadioIndex } from './design-panel';

afterEach(cleanup);

function renderPanel(props: Partial<Parameters<typeof DesignPanel>[0]> = {}) {
  const handlers = { onTemplate: vi.fn(), onColor: vi.fn(), onFontSize: vi.fn() };
  render(
    <DesignPanel
      templates={listResumeTemplates()}
      level="senior"
      template="senior-level-modern"
      color={RESUME_COLORS_MAP.black}
      fontSize="md"
      {...handlers}
      {...props}
    />,
  );
  return handlers;
}

describe('DesignPanel', () => {
  it('switches level and picks a template by its name', () => {
    const { onTemplate } = renderPanel();
    expect(screen.getByRole('button', { name: 'Senior level' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Use the Modern template, senior level' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Mid level' }));
    fireEvent.click(screen.getByRole('button', { name: 'Use the Ember template, mid level' }));
    expect(onTemplate).toHaveBeenCalledWith('mid-level-ember');
  });

  it('names each accent colour, shows the chosen one and moves with the arrow keys', () => {
    const { onColor } = renderPanel();
    const black = screen.getByRole('radio', { name: 'Black' });
    expect(black.getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radiogroup', { name: 'Accent colour' }).parentElement?.textContent).toContain('Black');
    fireEvent.keyDown(black, { key: 'ArrowRight' });
    expect(onColor).toHaveBeenCalledWith(RESUME_COLORS_MAP.talvio);
    fireEvent.click(screen.getByRole('radio', { name: 'Gold' }));
    expect(onColor).toHaveBeenLastCalledWith(RESUME_COLORS_MAP.yellow);
  });

  it('picks the text size from a radio group and keeps everything read-only when disabled', () => {
    const { onFontSize } = renderPanel();
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Medium' }), { key: 'ArrowRight' });
    expect(onFontSize).toHaveBeenCalledWith('lg');
    cleanup();

    renderPanel({ disabled: true });
    expect(screen.getByRole('radio', { name: 'Small' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('radio', { name: 'Mint' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: 'Use the Mint template, senior level' }).hasAttribute('disabled')).toBe(true);
  });

  it('wraps arrow keys around the group', () => {
    expect(nextRadioIndex('ArrowLeft', 0, 8)).toBe(7);
    expect(nextRadioIndex('ArrowDown', 7, 8)).toBe(0);
    expect(nextRadioIndex('End', 2, 3)).toBe(2);
    expect(nextRadioIndex('a', 0, 3)).toBeNull();
  });
});
