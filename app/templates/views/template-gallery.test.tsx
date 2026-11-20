import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { filterTemplates, listResumeTemplates } from '@lib/templates';

import { TemplateGallery } from './template-gallery';

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt, className }: { src: string; alt: string; className?: string }) => <img src={src} alt={alt} className={className} />,
}));

describe('TemplateGallery', () => {
  // Vitest runs without globals here, so Testing Library cannot clean up between tests on its own.
  afterEach(cleanup);

  it('renders one named card per template with its name, description, best-for line and preview', () => {
    const templates = listResumeTemplates();
    render(<TemplateGallery templates={templates} onSelect={() => {}} />);

    expect(screen.getByRole('region', { name: 'Templates' }).getAttribute('aria-roledescription')).toBe('carousel');
    expect(templates.map((template) => template.name)).toEqual([
      'Classic',
      'Modern',
      'Ember',
      'Mint',
      'Talvio',
      'Compact',
      'Minimal',
      'Executive',
      'Skills first',
      'Graduate',
      'Technical',
      'Sidebar',
      'Timeline',
      'Banner',
    ]);
    for (const [index, template] of templates.entries()) {
      const card = screen.getByRole('button', { name: `Use the ${template.name} template` });
      expect(card.textContent).toContain(template.description);
      expect(card.textContent).toContain(`Best for: ${template.bestFor}`);
      expect(card.querySelector('img')?.getAttribute('src')).toBe(template.imageUrl);
      expect(card.closest('li')?.getAttribute('aria-label')).toBe(`${index + 1} of ${templates.length}`);
    }
    // Use template is decoration: the card's accessible name already says it.
    for (const pill of screen.getAllByText('Use template')) {
      expect(pill.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('opens the chosen template by its key', () => {
    const onSelect = vi.fn();
    render(<TemplateGallery templates={listResumeTemplates()} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: 'Use the Technical template' }));
    expect(onSelect).toHaveBeenCalledWith('technical');
    fireEvent.click(screen.getByRole('button', { name: 'Use the Mint template' }));
    expect(onSelect).toHaveBeenLastCalledWith('senior-level-mint');
  });

  it('counts slides in place of dots, and disables the arrows at either end', () => {
    render(<TemplateGallery templates={filterTemplates(listResumeTemplates(), 'creative')} onSelect={() => {}} />);
    const previous = screen.getByRole('button', { name: 'Previous template' }) as HTMLButtonElement;
    const next = screen.getByRole('button', { name: 'Next template' }) as HTMLButtonElement;

    expect(screen.getByText('1 of 3')).toBeTruthy();
    expect(previous.disabled).toBe(true);
    fireEvent.click(next);
    fireEvent.click(next);
    expect(screen.getByText('3 of 3')).toBeTruthy();
    expect(next.disabled).toBe(true);
  });
});
