import Link from 'next/link';
import { cn } from '@utils/tailwind';
import { Button, NavigationMenu, NavigationMenuItem, ThemeToggle } from '@components/ui';
import { Icon } from '@components/icons';
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
  links: NavLink[];
};

export const SiteNavigationMenu = ({ className, links, user, withActions = false }: NavigationMenuProps) => {
  return (
    <div className={cn('flex w-full', className)}>
      <NavigationMenu className={cn('flex items-center justify-center md:ml-auto gap-6 2xl:gap-10')}>
        {links.map((link) => (
            <NavigationMenuItem key={link.name} asChild className={'text-primary text-md font-regular hover:cursor-pointer'}>
              <Link href={link.href}>{link.name}</Link>
            </NavigationMenuItem>
        ))}
      </NavigationMenu>
      {withActions && (
        <div className='flex justify-end items-center gap-2 ml-auto'>
          <ThemeToggle />
          {user ? <UserAvatar user={user} /> : <Link href={SIGN_IN_HREF} prefetch={false}>
            <Button variant={'ghost'} size={'sm'}>
              <Icon type={'User'} className="size-4 text-primary" />
              {SIGN_IN_LABEL}
              </Button>
            </Link>}
        </div>
      )}
    </div>
  );
};
