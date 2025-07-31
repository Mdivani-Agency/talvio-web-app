import { Footer, Header, StickyHeader } from "@components/views";
import { HomeNavigationMenu, ResponsiveNavigationMenu } from "./views";

export default function LandingPage({ children }: { children: React.ReactNode }) {
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
        <HomeNavigationMenu
          links={[
            { name: 'Workflow', href: '#workflow' },
            { name: 'Benefits', href: '#benefits' },
            { name: 'Price', href: '#plans' },
            { name: 'FAQ', href: '#faq' },
          ]} />
      </Footer>
    </div>
  );
}
