import Link from 'next/link';
import { cn } from '@utils/tailwind';
import { Button, NavigationMenu, NavigationMenuItem, ThemeToggle } from '@components/ui';
import { UserAvatar } from '@components/views';
import { Icon } from '@components/icons';

type NavigationMenuProps = {
  className?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  }
  withActions?: boolean;
  links: { name: string; href: string }[];
};

export const HomeNavigationMenu = ({ className, links, user, withActions = false }: NavigationMenuProps) => {
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
          {user ? <UserAvatar user={user} /> : <Link href={'/auth/sign-in'}>
            <Button variant={'ghost'} size={'sm'}>
              <Icon type={'User'} className="size-4 text-primary" />
              Sign in
              </Button>
            </Link>}
        </div>
      )}
    </div>
  );
};
