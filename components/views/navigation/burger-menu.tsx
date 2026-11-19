'use client';

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle,  DrawerTrigger, Button, NavigationMenu, NavigationMenuItem, Logo, ThemeToggle } from '@components/ui';
import { MenuIcon } from 'lucide-react';
import { cn } from '@lib/utils';
import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@components/icons';
import { Separator } from '@components/ui';
import { PRIMARY_CTA_HREF, PRIMARY_CTA_LABEL } from '@/lib/homepage-copy';
import { SIGN_IN_HREF, SIGN_IN_LABEL, type NavLink } from '@/lib/public-nav';
import { UserAvatar } from '../user-avatar';

interface BurgerMenuProps {
  className?: string;
  links: NavLink[];
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  }
  /** Sign in and Start free, shown when nobody is signed in. */
  authActions?: boolean;
}

export const BurgerMenu = ({ className, links, user, authActions = true }: BurgerMenuProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn(className)}>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button variant={'ghost'} size={'icon'} aria-label="Open menu">
            <MenuIcon className={'text-primary'} />
          </Button>
        </DrawerTrigger>
        <DrawerContent className='h-screen w-full'>
          <DrawerHeader>
            <DrawerTitle className='flex justify-center items-center gap-2'>
              <Logo size='small' />
            </DrawerTitle>
          </DrawerHeader>
          <NavigationMenu className='w-full max-w-auto flex flex-col justify-start items-start gap-4 p-4'>
            {links.map((link) => (
              <NavigationMenuItem key={link.name} asChild onClick={() => setOpen(false)}>
                <Link
                  href={link.href}
                  aria-current={link.current ? 'page' : undefined}
                  className={link.current ? 'text-lg font-semibold text-secondary dark:text-secondary-hover' : 'text-lg font-semibold text-primary'}
                >
                  {link.name}
                </Link>
              </NavigationMenuItem>
            ))}
            <Separator className='w-full' />
            <div className='flex flex-col gap-2'>
              {(user || authActions) && <NavigationMenuItem asChild>
                {user ?
                <Link className='flex items-center gap-2' href={'/account'}>
                  <UserAvatar user={user} />
                  <span className='text-primary text-md font-medium'>View account</span>
                </Link> :
                <Link className='flex items-center gap-2' href={SIGN_IN_HREF}>
                  <Button className='mr-2' variant={'ghost'} size={'icon'}>
                    <Icon type={'User'} className="size-4 text-primary" />
                  </Button>
                  <span className='text-primary text-md font-medium'>{SIGN_IN_LABEL}</span>
                </Link>
                }
              </NavigationMenuItem>}
              {!user && authActions && (
                <NavigationMenuItem asChild onClick={() => setOpen(false)}>
                  <Button asChild size={'lg'}>
                    <Link href={PRIMARY_CTA_HREF}>{PRIMARY_CTA_LABEL}</Link>
                  </Button>
                </NavigationMenuItem>
              )}
              <NavigationMenuItem asChild>
                <div className='flex items-center gap-2 text-primary text-md font-medium'>
                  <ThemeToggle />
                  <span className='text-primary text-md font-medium'>Display Mode</span>
                </div>
              </NavigationMenuItem>
            </div>
          </NavigationMenu>
        </DrawerContent>
      </Drawer>
    </div>
  );
};
