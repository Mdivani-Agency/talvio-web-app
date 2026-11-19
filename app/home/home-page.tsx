import { BENEFITS_TITLE, WORKFLOW_TITLE } from '@/lib/homepage-copy';

import { Benefits, Faq, Hero, NavSection, WhatsFree, Workflow } from './views';
import { Cta } from './views/cta';
import { PageContainer } from '@components/views';

export function HomePage() {
  return (
    <PageContainer as="main" className="flex flex-col items-center overflow-x-hidden pt-24 sm:items-start md:pt-0">
      <Hero />
      <NavSection id="workflow" title={WORKFLOW_TITLE} name="Workflow">
        <Workflow />
      </NavSection>
      <NavSection id="benefits" title={BENEFITS_TITLE} name="Benefits">
        <Benefits />
      </NavSection>
      <WhatsFree />
      <Faq />
      <Cta />
    </PageContainer>
  );
}
