'use client';
import { BurgerMenu } from './burger-menu';
import { SiteNavigationMenu } from './navigation-menu';
import { useUserSession } from '@lib/providers';
import type { NavLink } from '@/lib/public-nav';

// Full class names so Tailwind can see them. Pages with many links collapse to the burger menu until `lg`.
const COLLAPSE_CLASSES = {
  md: { menu: 'hidden md:flex w-full', burger: 'md:hidden' },
  lg: { menu: 'hidden lg:flex w-full', burger: 'lg:hidden' },
} as const;

export const ResponsiveNavigationMenu = ({
  links,
  collapseBelow = 'md',
}: {
  links: NavLink[];
  collapseBelow?: keyof typeof COLLAPSE_CLASSES;
}) => {
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
        className={COLLAPSE_CLASSES[collapseBelow].menu}
        links={links} />
      <BurgerMenu className={`ml-auto ${COLLAPSE_CLASSES[collapseBelow].burger}`} links={links} user={user} />
    </div>
  )
}
