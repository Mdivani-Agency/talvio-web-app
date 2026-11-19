import { Check, Info } from 'lucide-react';
import Link from 'next/link';

import { Button, Card } from '@components/ui';
import { cn } from '@lib/utils';
import {
  PAID_PLAN_FEATURES,
  PLAN_COMING_SOON,
  PLAN_PER_MONTH,
  PLAN_RECOMMENDED,
  PLAN_RESET_LEAD,
  PLANS_HEADING,
  PLANS_NOTE,
  PRICING_PLANS,
  type FreePlan,
  type PaidPlan,
} from '@/lib/pricing-page-copy';

import { LocalResetTime } from './local-reset-time';

const CARD_CLASS = 'relative h-full gap-5 rounded-[1.6rem] p-6 lg:p-7';

function Feature({ children, tone }: { children: React.ReactNode; tone: 'brand' | 'inverse' }) {
  return (
    <li className="flex gap-2.5">
      <Check
        aria-hidden="true"
        strokeWidth={2.25}
        className={cn('mt-0.5 size-[1.8rem] shrink-0', tone === 'brand' && 'text-secondary dark:text-secondary-hover')}
      />
      <span>{children}</span>
    </li>
  );
}

function FreeCard({ plan }: { plan: FreePlan }) {
  return (
    <Card className={cn(CARD_CLASS, 'bg-secondary text-secondary-foreground')}>
      <div>
        <h3 className="text-[2rem] font-semibold">{plan.name}</h3>
        <p className="mt-1 text-md">{plan.summary}</p>
      </div>
      <p className="flex items-baseline gap-2">
        <span className="text-3xl leading-none font-bold">{plan.price}</span>
        <span className="text-md">{plan.priceNote}</span>
      </p>
      <ul className="flex flex-col gap-2.5 text-md">
        {plan.features.map((feature) => (
          <Feature key={feature} tone="inverse">
            {feature}
          </Feature>
        ))}
      </ul>
      <Button
        asChild
        className="mt-auto h-[4.8rem] bg-secondary-foreground text-md font-semibold text-secondary hover:bg-secondary-foreground/90"
      >
        <Link href={plan.cta.href}>{plan.cta.label}</Link>
      </Button>
    </Card>
  );
}

function PaidCard({ plan }: { plan: PaidPlan }) {
  return (
    <Card className={cn(CARD_CLASS, 'text-primary', plan.recommended && 'ring-2 ring-secondary')}>
      {plan.recommended ? (
        <span
          data-allow-small-text
          className="absolute -top-[1.3rem] left-6 rounded-md bg-secondary px-2.5 text-xs leading-[1.75] font-semibold text-secondary-foreground lg:left-7"
        >
          {PLAN_RECOMMENDED}
        </span>
      ) : null}
      <div>
        <h3 className="text-[2rem] font-semibold">{plan.name}</h3>
        <p className="mt-1 text-md text-muted-foreground">{plan.summary}</p>
      </div>
      <p className="flex items-baseline gap-2">
        <span className="text-3xl leading-none font-bold">{plan.price}</span>
        <span className="text-md whitespace-nowrap text-muted-foreground">{PLAN_PER_MONTH}</span>
      </p>
      <ul className="flex flex-col gap-2.5 text-md">
        <Feature tone="brand">{plan.limit}</Feature>
        <Feature tone="brand">
          {PLAN_RESET_LEAD} <LocalResetTime />
        </Feature>
        {PAID_PLAN_FEATURES.map((feature) => (
          <Feature key={feature} tone="brand">
            {feature}
          </Feature>
        ))}
      </ul>
      {/* Not a link or a button: nothing here starts a payment until MDI-608. */}
      <span
        aria-disabled="true"
        className="mt-auto flex h-[4.8rem] items-center justify-center gap-2 rounded-md border border-dashed border-chart-2 text-md font-semibold text-muted-foreground dark:border-muted"
      >
        <Info aria-hidden="true" className="size-4" />
        {PLAN_COMING_SOON}
      </span>
    </Card>
  );
}

/** Free, Pro, Max and Ultra in a row from `lg`, one column below. */
export function PlanCards() {
  const [free, ...paid] = PRICING_PLANS;
  return (
    <section aria-labelledby="plans-heading">
      <h2 id="plans-heading" className="sr-only">
        {PLANS_HEADING}
      </h2>
      <ul className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <li>
          <FreeCard plan={free} />
        </li>
        {paid.map((plan) => (
          <li key={plan.name} className={cn(plan.recommended && 'mt-[1.3rem] lg:mt-0')}>
            <PaidCard plan={plan} />
          </li>
        ))}
      </ul>
      <p className="mt-5 flex gap-2 text-md text-muted-foreground md:justify-center">
        <Info aria-hidden="true" className="mt-0.5 size-[1.8rem] shrink-0" />
        <span>{PLANS_NOTE}</span>
      </p>
    </section>
  );
}
