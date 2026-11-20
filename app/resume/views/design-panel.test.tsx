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
  it('shows all 14 templates, marks the selected one, filters by chip and picks by name', () => {
    const { onTemplate } = renderPanel();
    expect(screen.getByText('14 templates')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Modern template, selected' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Modern is selected')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Technical (1)' }));
    expect(screen.getByText('1 of 14')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Classic template/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Technical template' }));
    expect(onTemplate).toHaveBeenCalledWith('technical');
  });

  it('marks the style of an older level key as selected', () => {
    renderPanel({ template: 'mid-level-mint' });
    expect(screen.getByRole('button', { name: 'Mint template, selected' })).toBeTruthy();
  });

  it('describes the selected template, its section order and the optional fields it shows', () => {
    const onFillOptionalField = vi.fn();
    renderPanel({ template: 'technical', onFillOptionalField });
    expect(screen.getByText('Technical is selected')).toBeTruthy();
    expect(screen.getByText('A skills table, the stack under each role, and project links. Best for engineering, data and IT.')).toBeTruthy();
    expect(screen.getByText('Section order: Skills, Experience, Projects, Education, Recommendations.')).toBeTruthy();
    expect(screen.getByText('Shows optional fields: skill groups, a stack per role. Empty ones are left out.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Fill them in' }));
    expect(onFillOptionalField).toHaveBeenCalledWith('skillGroups');
    cleanup();

    renderPanel({ template: 'senior-level-mint', sectionOrder: ['education', 'experience'] });
    expect(screen.getByText(/^Section order: your own \(Education, Experience, Skills/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Fill them in' })).toBeNull();
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
    expect(screen.getByRole('button', { name: 'Mint template' }).hasAttribute('disabled')).toBe(true);
  });

  it('wraps arrow keys around the group', () => {
    expect(nextRadioIndex('ArrowLeft', 0, 8)).toBe(7);
    expect(nextRadioIndex('ArrowDown', 7, 8)).toBe(0);
    expect(nextRadioIndex('End', 2, 3)).toBe(2);
    expect(nextRadioIndex('a', 0, 3)).toBeNull();
  });
});
