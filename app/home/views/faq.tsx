import { DetailsList } from '@components/ui';
import { FAQ_TITLE, HOME_FAQ } from '@/lib/homepage-copy';
import { HomeSectionHeading } from './home-section-heading';
import { HOME_SECTION_CLASS } from './nav-section';

export const Faq = () => {
  return (
    <section
      id="faq"
      className={`${HOME_SECTION_CLASS} grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:gap-16`}
    >
      <HomeSectionHeading name="FAQ" title={FAQ_TITLE} />
      <DetailsList qa={HOME_FAQ} openFirst />
    </section>
  );
};
