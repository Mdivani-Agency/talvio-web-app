import { Footer, Header, StickyHeader } from '@components/views';

import { HomeNavigationMenu, ResponsiveNavigationMenu } from './views';

const SECTION_LINKS = [
  { name: 'Workflow', href: '#workflow' },
  { name: 'Benefits', href: '#benefits' },
  { name: 'Price', href: '#plans' },
  { name: 'FAQ', href: '#faq' },
];

export function HomeShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-(family-var(--font-montserrat))">
      <Header>
        <ResponsiveNavigationMenu />
      </Header>
      <StickyHeader>
        <ResponsiveNavigationMenu />
      </StickyHeader>
      {children}
      <Footer>
        <HomeNavigationMenu links={SECTION_LINKS} />
      </Footer>
    </div>
  );
}
