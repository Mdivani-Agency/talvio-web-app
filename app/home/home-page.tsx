import {
  BENEFITS_TITLE,
  FAQ_TITLE,
  WHATS_FREE_ID,
  WHATS_FREE_NAME,
  WHATS_FREE_TITLE,
  WORKFLOW_TITLE,
} from '@/lib/homepage-copy';

import { Benefits, Faq, Hero, NavSection, WhatsFree, Workflow } from './views';
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
      <NavSection id={WHATS_FREE_ID} title={WHATS_FREE_TITLE} name={WHATS_FREE_NAME}>
        <WhatsFree />
      </NavSection>
      <NavSection id="faq" title={FAQ_TITLE} name="FAQ">
        <Faq />
      </NavSection>
      <Cta />
    </main>
  );
}
