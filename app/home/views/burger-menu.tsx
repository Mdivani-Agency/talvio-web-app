'use client';

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle,  DrawerTrigger, Button, NavigationMenu, NavigationMenuItem, Logo, ThemeToggle } from '@components/ui';
import { MenuIcon } from 'lucide-react';
import { cn } from '@lib/utils';
import Link from 'next/link';
import { useState } from 'react';
import { UserAvatar } from '@components/views';
import { Icon } from '@components/icons';
import { Separator } from '@components/ui';

interface BurgerMenuProps {
  className?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  }
}

export const BurgerMenu = ({ className, user }: BurgerMenuProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('md:hidden', className)}>
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
            <NavigationMenuItem asChild onClick={() => setOpen(false)}>
              <Link href='#benefits' className='text-primary text-lg font-semibold'>Benefits</Link>
            </NavigationMenuItem>
            <NavigationMenuItem asChild onClick={() => setOpen(false)}>
              <Link href='#plans' className='text-primary text-lg font-semibold'>Price</Link>
            </NavigationMenuItem>
            <NavigationMenuItem asChild onClick={() => setOpen(false)}>
              <Link href='#faq' className='text-primary text-lg font-semibold'>FAQ</Link>
            </NavigationMenuItem>
            <NavigationMenuItem asChild onClick={() => setOpen(false)}>
              <Link href='#workflow' className='text-primary text-lg font-semibold'>Workflows</Link>
            </NavigationMenuItem>
            <NavigationMenuItem asChild onClick={() => setOpen(false)}>
              <span className='text-primary text-lg font-semibold'>Account</span>
            </NavigationMenuItem>
            <Separator className='w-full' />
            <div className='flex flex-col gap-2'>
              <NavigationMenuItem asChild>
                {user ?
                <Link className='flex items-center gap-2' href={'/account'}>
                  <UserAvatar user={user} />
                  <span className='text-primary text-md font-medium'>View account</span>
                </Link> :
                <Link className='flex items-center gap-2' href={'/auth/sign-in'}>
                  <Button className='mr-2' variant={'ghost'} size={'icon'}>
                    <Icon type={'User'} className="size-4 text-primary" />
                  </Button>
                  <span className='text-primary text-md font-medium'>Sign in</span>
                </Link>
                }
              </NavigationMenuItem>
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
