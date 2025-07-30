import { Header, StickyHeader } from "@components/views";
import { Benefits, Faq, Hero, NavSection, Plans, Workflow } from "./views";
import { Cta } from "./views/cta";

export default function LandingPage() {
  return (
    <main className="flex flex-col items-center gap-8 overflow-x-hidden px-4 md:px-6 pt-24 sm:items-start md:pt-0">
      <Hero />
      <NavSection id="workflow" title="Build Your Resume in Minutes" name="Workflow">
        <Workflow />
      </NavSection>
      <NavSection id="benefits" title="Why Choose Talvio?" name="Benefits">
        <Benefits />
      </NavSection>
      <NavSection id="plans" title="Pay as you go" name="Price">
        <Plans />
      </NavSection>
      <NavSection id="faq" title="Frequently Asked Questions" name="FAQ">
        <Faq />
      </NavSection>
      <Cta />
    </main>
  );
}
