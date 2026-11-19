import Link from 'next/link';
import { cn } from '@utils/tailwind';
import { Button, NavigationMenu, NavigationMenuItem, ThemeToggle } from '@components/ui';
import { Icon } from '@components/icons';
import { PRIMARY_CTA_HREF, PRIMARY_CTA_LABEL } from '@/lib/homepage-copy';
import { SIGN_IN_HREF, SIGN_IN_LABEL, type NavLink } from '@/lib/public-nav';
import { UserAvatar } from '../user-avatar';

type NavigationMenuProps = {
  className?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  }
  withActions?: boolean;
  /** Sign in and Start free, shown with the actions when nobody is signed in. */
  authActions?: boolean;
  links: NavLink[];
};

export const SiteNavigationMenu = ({ className, links, user, withActions = false, authActions = true }: NavigationMenuProps) => {
  return (
    <div className={cn('flex w-full', className)}>
      <NavigationMenu className={cn('flex items-center justify-center md:ml-auto gap-6 2xl:gap-10 whitespace-nowrap')}>
        {links.map((link) => (
            <NavigationMenuItem
              key={link.name}
              asChild
              className={cn(
                'text-md hover:cursor-pointer',
                link.current ? 'font-semibold text-secondary dark:text-secondary-hover' : 'font-regular text-primary',
              )}
            >
              <Link href={link.href} aria-current={link.current ? 'page' : undefined}>{link.name}</Link>
            </NavigationMenuItem>
        ))}
      </NavigationMenu>
      {withActions && (
        <div className='flex justify-end items-center gap-2 ml-auto'>
          <ThemeToggle />
          {user ? <UserAvatar user={user} /> : authActions && (
            <>
              <Link href={SIGN_IN_HREF} prefetch={false}>
                <Button variant={'ghost'} size={'sm'}>
                  <Icon type={'User'} className="size-4 text-primary" />
                  {SIGN_IN_LABEL}
                </Button>
              </Link>
              <Button asChild size={'sm'}>
                <Link href={PRIMARY_CTA_HREF} prefetch={false}>{PRIMARY_CTA_LABEL}</Link>
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
