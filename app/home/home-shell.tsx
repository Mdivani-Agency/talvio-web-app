import { Footer, Header, ResponsiveNavigationMenu, SiteNavigationMenu, StickyHeader } from '@components/views';
import { HOME_NAV_LINKS, HOME_SECTION_LINKS } from '@/lib/public-nav';

export function HomeShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-(family-var(--font-montserrat))">
      <Header>
        <ResponsiveNavigationMenu links={HOME_NAV_LINKS} collapseBelow="xl" />
      </Header>
      <StickyHeader>
        <ResponsiveNavigationMenu links={HOME_NAV_LINKS} collapseBelow="xl" />
      </StickyHeader>
      {children}
      <Footer>
        <SiteNavigationMenu links={HOME_SECTION_LINKS} />
      </Footer>
    </div>
  );
}
