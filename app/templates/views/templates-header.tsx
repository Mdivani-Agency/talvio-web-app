import { cn } from '@lib/utils';
import {
  TEMPLATES_LEVEL_GROUP_LABEL,
  TEMPLATES_LEVELS,
  TEMPLATES_PAGE_HEADING,
  TEMPLATES_PAGE_INTRO,
  type TemplatesPageLevel,
} from '@/lib/templates-page-copy';

type TemplatesHeaderProps = {
  level: TemplatesPageLevel;
  onChangeLevel: (level: TemplatesPageLevel) => void;
};

/**
 * The `/templates` heading, intro and level switch. The resume editor's "Switch Template" view keeps its own selector
 * (`app/resume/views/templates.tsx`) until the editor refresh.
 */
export function TemplatesHeader({ level, onChangeLevel }: TemplatesHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-3 text-center lg:gap-4">
      <h1 className="text-[3.2rem] leading-[1.2] font-semibold tracking-[-0.01em] text-primary lg:text-3xl">
        {TEMPLATES_PAGE_HEADING}
      </h1>
      <p className="text-md leading-[1.556] text-muted-foreground lg:text-lg">{TEMPLATES_PAGE_INTRO}</p>
      <div
        role="group"
        aria-label={TEMPLATES_LEVEL_GROUP_LABEL}
        className="mt-3 inline-flex max-w-full gap-1 rounded-lg bg-popover p-1 lg:mt-4 dark:bg-card"
      >
        {TEMPLATES_LEVELS.map(({ id, label }) => {
          const selected = level === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChangeLevel(id)}
              className={cn(
                'h-10 rounded-md px-3 text-md whitespace-nowrap transition-colors outline-none hover:cursor-pointer focus-visible:ring-2 focus-visible:ring-ring lg:px-5',
                selected
                  ? 'bg-background font-semibold text-foreground shadow-sm'
                  : 'font-medium text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
