import { Check } from 'lucide-react';

import { Card } from '@components/ui';
import { cn } from '@lib/utils';
import { ALWAYS_FREE, COUNTS_AS_ONE, COUNTS_HEADING } from '@/lib/pricing-page-copy';

import { PricingSectionHeading } from './pricing-section-heading';

type Rule = { badge: string; title: string; items: readonly string[] };

function RuleCard({ rule, filled }: { rule: Rule; filled: boolean }) {
  return (
    <Card className="gap-4 rounded-[1.6rem] p-6 text-primary lg:p-7">
      <h3 className="flex items-center gap-2.5 text-lg font-semibold">
        <span
          aria-hidden="true"
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-full text-md font-bold',
            filled
              ? 'bg-secondary text-secondary-foreground'
              : 'bg-popover text-secondary dark:bg-accent dark:text-secondary-hover',
          )}
        >
          {rule.badge}
        </span>
        {rule.title}
      </h3>
      <ul className="flex flex-col gap-2.5 text-md">
        {rule.items.map((item) => (
          <li key={item} className="flex gap-2.5">
            <Check
              aria-hidden="true"
              strokeWidth={2.25}
              className="mt-0.5 size-[1.8rem] shrink-0 text-secondary dark:text-secondary-hover"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** The same rules as the homepage: what spends a new PDF, and what never does. */
export function PdfCounts() {
  return (
    <section aria-labelledby="counts-heading">
      <PricingSectionHeading id="counts-heading" title={COUNTS_HEADING} className="mb-6 md:mb-10 md:text-center" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <RuleCard rule={COUNTS_AS_ONE} filled />
        <RuleCard rule={ALWAYS_FREE} filled={false} />
      </div>
    </section>
  );
}
