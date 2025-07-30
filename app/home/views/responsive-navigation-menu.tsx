'use client';
import { BurgerMenu } from "./burger-menu";
import { HomeNavigationMenu } from "./navigation-menu";
import { authClient } from "@lib/auth.client";

export const ResponsiveNavigationMenu = () => {
  const { data } = authClient.useSession();

  return (
    <div className="w-full">
      <HomeNavigationMenu
        user={data?.user}
        withSignIn={true}
        className="hidden md:flex w-full"
        links={[
          { name: 'Workflow', href: '#workflow' },
          { name: 'Benefits', href: '#benefits' },
          { name: 'Price', href: '#plans' },
          { name: 'FAQ', href: '#faq' },
        ]} />
      <BurgerMenu user={data?.user} />
    </div>
  )
}
