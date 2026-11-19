import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { listResumeTemplates } from '@lib/templates';

import { TemplateGallery } from './template-gallery';

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt, className }: { src: string; alt: string; className?: string }) => <img src={src} alt={alt} className={className} />,
}));

describe('TemplateGallery', () => {
  // Vitest runs without globals here, so Testing Library cannot clean up between tests on its own.
  afterEach(cleanup);

  it('renders one named card per template with the style name, description and preview', () => {
    render(<TemplateGallery level="senior" onSelect={() => {}} />);

    const templates = listResumeTemplates().senior;
    expect(screen.getByRole('region', { name: 'Senior level templates' }).getAttribute('aria-roledescription')).toBe('carousel');
    for (const [index, template] of templates.entries()) {
      const card = screen.getByRole('button', { name: `Use the ${template.name} template, senior level` });
      expect(card.textContent).toContain(template.description);
      expect(card.querySelector('img')?.getAttribute('alt')).toBe(`senior ${template.name}`);
      expect(card.closest('li')?.getAttribute('aria-label')).toBe(`${index + 1} of ${templates.length}`);
    }
    // Use template is decoration: the card's accessible name already says it.
    for (const pill of screen.getAllByText('Use template')) {
      expect(pill.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('opens the chosen template', () => {
    const onSelect = vi.fn();
    render(<TemplateGallery level="entry" onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: 'Use the Mint template, entry level' }));
    expect(onSelect).toHaveBeenCalledWith('entry-level-mint');
  });

  it('moves the current dot with the arrows and dots, and disables the arrows at either end', () => {
    render(<TemplateGallery level="mid" onSelect={() => {}} />);
    const previous = screen.getByRole('button', { name: 'Previous template' }) as HTMLButtonElement;
    const next = screen.getByRole('button', { name: 'Next template' }) as HTMLButtonElement;
    const current = () => screen.getAllByRole('button', { name: /^Show / }).find((dot) => dot.getAttribute('aria-current'))?.getAttribute('aria-label');

    expect(current()).toBe('Show Modern');
    expect(previous.disabled).toBe(true);
    fireEvent.click(next);
    expect(current()).toBe('Show Ember');
    fireEvent.click(screen.getByRole('button', { name: 'Show Talvio' }));
    expect(current()).toBe('Show Talvio');
    expect(next.disabled).toBe(true);
    fireEvent.click(previous);
    expect(current()).toBe('Show Mint');
  });
});
