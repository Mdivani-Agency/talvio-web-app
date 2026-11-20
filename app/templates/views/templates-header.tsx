import { TemplateFilterChips } from '@components/templates/template-filter-chips';
import { TEMPLATES_PAGE_HEADING, TEMPLATES_PAGE_INTRO, templatesShowingLabel, type TemplateFilter } from '@/lib/templates-page-copy';

type TemplatesHeaderProps = {
  filter: TemplateFilter | 'all';
  counts: Record<TemplateFilter | 'all', number>;
  shown: number;
  onChangeFilter: (filter: TemplateFilter | 'all') => void;
};

/** The `/templates` heading, intro, filter chips and the count of templates showing. */
export function TemplatesHeader({ filter, counts, shown, onChangeFilter }: TemplatesHeaderProps) {
  return (
    <div className="flex flex-col gap-3 text-center lg:gap-4">
      <h1 className="text-[3.2rem] leading-[1.2] font-semibold tracking-[-0.01em] text-primary lg:text-3xl">
        {TEMPLATES_PAGE_HEADING}
      </h1>
      <p className="text-md leading-[1.556] text-muted-foreground lg:text-lg">{TEMPLATES_PAGE_INTRO}</p>
      <TemplateFilterChips value={filter} counts={counts} onChange={onChangeFilter} className="mt-3 lg:mt-4" />
      <p aria-live="polite" className="text-left text-sm text-muted-foreground md:text-center">
        {templatesShowingLabel(shown, counts.all)}
      </p>
    </div>
  );
}
