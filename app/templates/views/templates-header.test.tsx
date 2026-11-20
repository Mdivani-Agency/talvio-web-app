import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { templateFilterCounts } from '@lib/templates';
import { TEMPLATES_PAGE_HEADING, TEMPLATES_PAGE_INTRO } from '@/lib/templates-page-copy';

import { TemplatesHeader } from './templates-header';

describe('TemplatesHeader', () => {
  // Vitest runs without globals here, so Testing Library cannot clean up between tests on its own.
  afterEach(cleanup);

  it('renders the heading, intro, the filter chips with counts and the count line', () => {
    render(<TemplatesHeader filter="all" counts={templateFilterCounts()} shown={14} onChangeFilter={() => {}} />);

    expect(screen.getByRole('heading', { level: 1, name: TEMPLATES_PAGE_HEADING })).toBeTruthy();
    expect(screen.getByText(TEMPLATES_PAGE_INTRO)).toBeTruthy();
    const buttons = [...screen.getByRole('group', { name: 'Filter templates' }).querySelectorAll('button')];
    expect(buttons.map((button) => button.textContent)).toEqual([
      'All (14)',
      'First job (4)',
      'Experienced (9)',
      'Senior (4)',
      'Technical (1)',
      'Creative (3)',
      'Career change (1)',
    ]);
    expect(buttons.map((button) => button.getAttribute('aria-pressed'))).toEqual([
      'true',
      'false',
      'false',
      'false',
      'false',
      'false',
      'false',
    ]);
    expect(screen.getByText('Showing all 14 templates').getAttribute('aria-live')).toBe('polite');
  });

  it('reports the chosen filter and counts what it shows', () => {
    const onChangeFilter = vi.fn();
    render(<TemplatesHeader filter="first-job" counts={templateFilterCounts()} shown={4} onChangeFilter={onChangeFilter} />);

    expect(screen.getByText('Showing 4 of 14 templates')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Creative (3)' }));
    expect(onChangeFilter).toHaveBeenCalledWith('creative');
  });
});
