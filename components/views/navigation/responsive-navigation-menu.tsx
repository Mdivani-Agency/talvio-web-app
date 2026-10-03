'use client';
import { BurgerMenu } from './burger-menu';
import { SiteNavigationMenu } from './navigation-menu';
import { useUserSession } from '@lib/providers';
import type { NavLink } from '@/lib/public-nav';

export const ResponsiveNavigationMenu = ({ links }: { links: NavLink[] }) => {
  const { session } = useUserSession();
  const user = session?.user
    ? {
        id: session.user.id,
        name: session.user.name ?? session.user.email,
        email: session.user.email,
        image: session.user.image,
      }
    : undefined;

  return (
    <div className="flex w-full">
      <SiteNavigationMenu
        user={user}
        withActions={true}
        className="hidden md:flex w-full"
        links={links} />
      <BurgerMenu className="ml-auto" links={links} user={user} />
    </div>
  )
}
