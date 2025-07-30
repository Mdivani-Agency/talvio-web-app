'use client';
import { Icon } from "@components/icons";
import { Button } from "@components/ui";
import { Header, StickyHeader, UserAvatar } from "@components/views";
import { SessionContext } from "@lib/providers";
import Link from "next/link";
import { useContext, useMemo } from "react";

export const ResponsiveHeader = () => {
  const { session } = useContext(SessionContext);

  const actions = useMemo(() => {
    if (!session) {
      return <Link href={'/auth/sign-in'} className='ml-auto'>
        <Button variant={'ghost'} size={'sm'}>
          <Icon type={'User'} className="size-4 text-primary" />
          Sign in
        </Button>
      </Link>
    }

    return <UserAvatar user={{
      id: session.user.id,
      name: session.user.name || '',
      email: session.user.email,
      image: session.user.image || undefined,
    }} className="ml-auto" />
  }, [session]);

  return (
    <>
        <Header>{actions}</Header>
        <StickyHeader>{actions}</StickyHeader>
    </>
  );
};
