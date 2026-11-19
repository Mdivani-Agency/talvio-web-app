import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TEMPLATES_PAGE_HEADING, TEMPLATES_PAGE_INTRO } from '@/lib/templates-page-copy';

import { TemplatesHeader } from './templates-header';

describe('TemplatesHeader', () => {
  // Vitest runs without globals here, so Testing Library cannot clean up between tests on its own.
  afterEach(cleanup);

  it('renders the heading, intro and a named level group with the current level pressed', () => {
    render(<TemplatesHeader level="senior" onChangeLevel={() => {}} />);

    expect(screen.getByRole('heading', { level: 1, name: TEMPLATES_PAGE_HEADING })).toBeTruthy();
    expect(screen.getByText(TEMPLATES_PAGE_INTRO)).toBeTruthy();
    const group = screen.getByRole('group', { name: 'Experience level' });
    const buttons = [...group.querySelectorAll('button')];
    expect(buttons.map((button) => button.textContent)).toEqual(['Entry level', 'Mid level', 'Senior level']);
    expect(buttons.map((button) => button.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'true']);
    expect(buttons.every((button) => button.type === 'button')).toBe(true);
  });

  it('reports the chosen level', () => {
    const onChangeLevel = vi.fn();
    render(<TemplatesHeader level="senior" onChangeLevel={onChangeLevel} />);

    fireEvent.click(screen.getByRole('button', { name: 'Entry level' }));
    expect(onChangeLevel).toHaveBeenCalledWith('entry');
  });
});
