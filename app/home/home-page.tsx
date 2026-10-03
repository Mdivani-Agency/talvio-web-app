import { BENEFITS_TITLE, WORKFLOW_TITLE } from '@/lib/homepage-copy';

import { Benefits, Faq, Hero, NavSection, Plans, Workflow } from './views';
import { Cta } from './views/cta';

export function HomePage() {
  return (
    <main className="flex flex-col items-center gap-8 overflow-x-hidden px-4 pt-24 sm:items-start md:px-6 md:pt-0">
      <Hero />
      <NavSection id="workflow" title={WORKFLOW_TITLE} name="Workflow">
        <Workflow />
      </NavSection>
      <NavSection id="benefits" title={BENEFITS_TITLE} name="Benefits">
        <Benefits />
      </NavSection>
      <NavSection id="plans" title="Pay as you go" name="Price">
        <Plans />
      </NavSection>
      <NavSection id="faq" title="Frequently asked questions" name="FAQ">
        <Faq />
      </NavSection>
      <Cta />
    </main>
  );
}
