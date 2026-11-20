import { featureFlags } from '@/lib/flags';
import { BENEFITS_TITLE, WORKFLOW_TITLE } from '@/lib/homepage-copy';
import { reviewsToShow } from '@/lib/reviews-copy';

import { Benefits, Faq, Hero, NavSection, Reviews, WhatsFree, Workflow } from './views';
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
      {/* Hidden unless `trustpilotReviews` is on and 3 or more quotes are listed (MDI-653). */}
      <Reviews reviews={reviewsToShow(featureFlags().trustpilotReviews)} />
      <Faq />
      <Cta />
    </PageContainer>
  );
}
