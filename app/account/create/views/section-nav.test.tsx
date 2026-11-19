import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SectionNav, sectionLinkLabel } from './section-nav';

afterEach(cleanup);

describe('SectionNav', () => {
  it('names each link with its title, status and note in one phrase', () => {
    expect(sectionLinkLabel({ id: 'contact', title: 'Contact information', state: 'error', note: 'Fix 1' })).toBe(
      'Contact information, has errors, Fix 1',
    );
    expect(sectionLinkLabel({ id: 'about', title: 'About you', state: 'done', note: '' })).toBe('About you, complete');

    render(
      <SectionNav
        sections={[
          { id: 'contact', title: 'Contact information', state: 'error', note: 'Fix 1' },
          { id: 'projects', title: 'Projects', state: 'todo', note: 'Optional' },
        ]}
      />,
    );
    const nav = screen.getByRole('navigation', { name: 'Profile sections' });
    expect(screen.getByRole('link', { name: 'Contact information, has errors, Fix 1' }).getAttribute('href')).toBe('#contact');
    expect(screen.getByRole('link', { name: 'Projects, not started, Optional' })).toBeTruthy();
    expect(nav.textContent).toContain('Contact information');
  });
});
