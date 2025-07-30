'use client';

import { authClient } from '@lib/auth.client';
import { Icon } from '@components/icons';
import {
  Avatar,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  AvatarImage,
  AvatarFallback,
} from '@components/ui';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@lib/utils';

interface UserAvatarProps {
  className?: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  }
}

export function UserAvatar({ className, user }: UserAvatarProps) {
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    setOpen(false);
    await authClient.signOut();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className={cn('size-8', className)}>
            <AvatarImage src={user?.image || ''} />
            <AvatarFallback>
              {user?.name?.charAt(0) || 'A'}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='w-36' align='end' sideOffset={10}>
          <DropdownMenuItem asChild>
            <Link href={`/account/${user?.id}`}>
              <Icon type="User" className="size-4 text-primary" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Icon type="Logout" className="size-4 text-primary" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign out</DialogTitle>
            <DialogDescription>Are you sure you want to sign out?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleSignOut}>Sign out</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
