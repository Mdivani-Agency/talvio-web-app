import { SECTION_NAV_LABEL, SECTION_STATUS_TEXT } from '@/lib/onboarding-copy';
import { cn } from '@lib/utils';

import type { SectionStatus } from './profile-sections';

/** What a screen reader hears for a section link: "Contact information, has errors, Fix 1". */
export function sectionLinkLabel(section: SectionStatus): string {
  return [section.title, SECTION_STATUS_TEXT[section.state], section.note].filter(Boolean).join(', ');
}

/** The side list of profile sections: each links to its card and shows a done or a fix mark. */
export function SectionNav({ sections, className }: { sections: SectionStatus[]; className?: string }) {
  return (
    <nav aria-label={SECTION_NAV_LABEL} className={cn('rounded-[1.2rem] bg-card p-3', className)}>
      <ul className="flex flex-col gap-0.5">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              aria-label={sectionLinkLabel(section)}
              className="flex min-h-[4rem] items-center gap-2.5 rounded-md px-2 text-sm text-foreground hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-full text-[1.1rem] leading-none font-bold',
                  section.state === 'done' && 'bg-secondary text-secondary-foreground',
                  section.state === 'error' && 'bg-destructive text-white',
                  section.state === 'todo' && 'border border-muted-foreground/50',
                )}
              >
                {section.state === 'done' ? '✓' : section.state === 'error' ? '!' : null}
              </span>
              <span className="flex-1">{section.title}</span>
              {section.note ? (
                <span
                  data-allow-small-text
                  className={cn('text-xs', section.state === 'error' ? 'text-foreground' : 'text-muted-foreground')}
                >
                  {section.note}
                </span>
              ) : null}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
