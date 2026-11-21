import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ImportReviewPanel } from './import-review-panel';

afterEach(cleanup);

const targetFor = (section: string) => (section === 'Experience' ? { href: '#experience', label: 'Experience' } : null);

describe('ImportReviewPanel (MDI-674)', () => {
  it('lists what to check with a link to each part of the form it has', () => {
    render(
      <ImportReviewPanel
        source="cv.pdf"
        targetFor={targetFor}
        review={{
          partial: false,
          items: [
            { section: 'Experience', message: 'The start month at Brightline Studio was not clear.' },
            { section: 'Recommendations', message: 'One recommendation was left out.' },
          ],
        }}
      />,
    );
    expect(screen.getByRole('heading', { name: 'We filled in your profile from cv.pdf' })).toBeTruthy();
    expect(screen.getByText('Check these 2 things, then save. Nothing is saved until you press Save profile.')).toBeTruthy();
    const items = screen.getAllByRole('listitem');
    expect(items[0]!.textContent).toContain('Experience: The start month at Brightline Studio was not clear.');
    expect(screen.getByRole('link', { name: 'Go to Experience' }).getAttribute('href')).toBe('#experience');
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('titles a partial read and lists nothing when there is nothing to check', () => {
    render(<ImportReviewPanel source="your pasted text" targetFor={targetFor} review={{ partial: true, items: [] }} />);
    expect(screen.getByRole('heading', { name: 'Part of your resume could not be read' })).toBeTruthy();
    expect(screen.getByText(/We filled in what we could from your pasted text/)).toBeTruthy();
    expect(screen.queryByRole('list')).toBeNull();
  });
});
