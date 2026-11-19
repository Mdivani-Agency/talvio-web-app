'use client';
import { BurgerMenu } from './burger-menu';
import { SiteNavigationMenu } from './navigation-menu';
import { useUserSession } from '@lib/providers';
import type { NavLink } from '@/lib/public-nav';

// Full class names so Tailwind can see them. The homepage, with seven links plus Sign in and Start free, collapses until `xl`.
const COLLAPSE_CLASSES = {
  md: { menu: 'hidden md:flex w-full', burger: 'md:hidden' },
  lg: { menu: 'hidden lg:flex w-full', burger: 'lg:hidden' },
  xl: { menu: 'hidden xl:flex w-full', burger: 'xl:hidden' },
} as const;

export const ResponsiveNavigationMenu = ({
  links,
  collapseBelow = 'md',
  authActions = true,
}: {
  links: NavLink[];
  collapseBelow?: keyof typeof COLLAPSE_CLASSES;
  /** Sign in and Start free. Off on the auth pages, where the visitor is already signing in. */
  authActions?: boolean;
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
        authActions={authActions}
        className={COLLAPSE_CLASSES[collapseBelow].menu}
        links={links} />
      <BurgerMenu className={`ml-auto ${COLLAPSE_CLASSES[collapseBelow].burger}`} links={links} user={user} authActions={authActions} />
    </div>
  )
}
