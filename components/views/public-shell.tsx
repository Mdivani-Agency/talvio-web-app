import { PropsWithChildren } from 'react';
import { PUBLIC_PAGE_LINKS, type NavLink } from '@/lib/public-nav';
import { Footer } from './footer';
import { Header } from './header';
import { ResponsiveNavigationMenu } from './navigation/responsive-navigation-menu';
import { StickyHeader } from './sticky-header';

type PublicShellProps = {
  links?: NavLink[];
  size?: 'small' | 'medium' | 'large';
  withFooter?: boolean;
};

/** Header navigation, sticky header and footer shared by the public pages. */
export const PublicShell = ({
  children,
  links = PUBLIC_PAGE_LINKS,
  size = 'large',
  withFooter = true,
}: PropsWithChildren<PublicShellProps>) => {
  return (
    <div className="flex min-h-screen flex-col justify-between font-(family-var(--font-montserrat))">
      <Header size={size}>
        <ResponsiveNavigationMenu links={links} />
      </Header>
      <StickyHeader size={size}>
        <ResponsiveNavigationMenu links={links} />
      </StickyHeader>
      {children}
      {withFooter ? <Footer /> : null}
    </div>
  );
};
