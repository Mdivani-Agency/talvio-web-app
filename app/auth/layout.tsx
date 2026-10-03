import { Header, ResponsiveNavigationMenu, StickyHeader } from "@components/views";
import { PRIVATE_ROBOTS } from '@/lib/public-metadata';
import { PUBLIC_PAGE_LINKS } from '@/lib/public-nav';

export const metadata = { robots: PRIVATE_ROBOTS };

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-(family-var(--font-montserrat))">
      <Header>
        <ResponsiveNavigationMenu links={PUBLIC_PAGE_LINKS} />
      </Header>
      <StickyHeader>
        <ResponsiveNavigationMenu links={PUBLIC_PAGE_LINKS} />
      </StickyHeader>
      {children}
    </div>
  );
}
