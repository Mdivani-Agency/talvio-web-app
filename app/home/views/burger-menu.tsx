'use client';

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerTrigger, Button, NavigationMenu, NavigationMenuItem, NavigationMenuLink, DrawerClose } from '@components/ui';
import { MenuIcon } from 'lucide-react';
import { cn } from '@lib/utils';
import Link from 'next/link';
import { useState } from 'react';
import { UserAvatar } from '@components/views';
import { Icon } from '@components/icons';

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
          <Button variant={'ghost'} size={'icon'}>
            <MenuIcon className={'text-primary'} />
          </Button>
        </DrawerTrigger>
        <DrawerContent className='h-screen'>
          <DrawerHeader className='invisible'>
            <DrawerTitle className='text-md font-semibold text-primary'>Menu</DrawerTitle>
          </DrawerHeader>
            <NavigationMenu className='flex flex-col items-start gap-4 p-4'>
              <NavigationMenuItem asChild>
                {user ? <UserAvatar user={user} /> : <Link href={'/auth/sign-in'}>
                  <Button variant={'ghost'} size={'icon'}>
                    <Icon type={'User'} className="size-4 text-primary" />
                  </Button>
                </Link>
                }
              </NavigationMenuItem>
              <NavigationMenuItem asChild onClick={() => setOpen(false)}>
                <Link href='#workflow'>Workflow</Link>
              </NavigationMenuItem>
              <NavigationMenuItem asChild onClick={() => setOpen(false)}>
                <Link href='#benefits'>Benefits</Link>
              </NavigationMenuItem>
              <NavigationMenuItem asChild onClick={() => setOpen(false)}>
                <Link href='#plans'>Price</Link>
              </NavigationMenuItem>
              <NavigationMenuItem asChild onClick={() => setOpen(false)}>
                <Link href='#faq'>FAQ</Link>
              </NavigationMenuItem>
            </NavigationMenu>
        </DrawerContent>
      </Drawer>
    </div>
  );
};
