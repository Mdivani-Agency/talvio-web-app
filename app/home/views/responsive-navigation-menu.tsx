'use client';
import { BurgerMenu } from "./burger-menu";
import { HomeNavigationMenu } from "./navigation-menu";
import { useUserSession } from '@lib/providers';

export const ResponsiveNavigationMenu = () => {
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
      <HomeNavigationMenu
        user={user}
        withActions={true}
        className="hidden md:flex w-full"
        links={[
          { name: 'Workflow', href: '#workflow' },
          { name: 'Benefits', href: '#benefits' },
          { name: 'Price', href: '#plans' },
          { name: 'FAQ', href: '#faq' },
        ]} />
      <BurgerMenu className="ml-auto" user={user} />
    </div>
  )
}
