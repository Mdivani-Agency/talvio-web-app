'use client';

import { Button, Drawer, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger, Logo } from '@components/ui';
import { BetaTag } from '@components/views';
import { cn } from '@lib/utils';
import { useUserSession } from '@lib/providers';
import { useSignOut } from '@lib/auth/use-sign-out';
import { featureFlags } from '@/lib/flags';
import {
  ACCOUNT_MENU_OPEN_LABEL,
  ACCOUNT_MENU_TITLE,
  ACCOUNT_NAV_LABEL,
  ACCOUNT_NAV_LINKS,
  CREATE_RESUME_HREF,
  CREATE_RESUME_LABEL,
  DARK_THEME_LABEL,
  LIGHT_THEME_LABEL,
  PREMIUM_BODY,
  PREMIUM_CTA_HREF,
  PREMIUM_CTA_LABEL,
  PREMIUM_TITLE,
  SIGN_OUT_LABEL,
  accountInitials,
  activeAccountHref,
} from '@/lib/account-copy';
import { FileText, LogOut, MenuIcon, Moon, Plus, Sun, UserRound } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV_ICONS: Record<string, typeof UserRound> = {
  '/account': UserRound,
  '/account/documents': FileText,
};

const rowClassName =
  'flex h-[4.4rem] items-center gap-3 rounded-md px-3 text-sm transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50';
const actionClassName = cn(rowClassName, 'h-[4rem] w-full font-medium text-foreground hover:bg-popover dark:hover:bg-accent/60');

const AccountNav = ({ onNavigate }: { onNavigate?: () => void }) => {
  const active = activeAccountHref(usePathname() ?? '');
  return (
    <nav aria-label={ACCOUNT_NAV_LABEL}>
      <ul className="flex flex-col gap-1">
        {ACCOUNT_NAV_LINKS.map((link) => {
          const current = link.href === active;
          const NavIcon = NAV_ICONS[link.href] ?? UserRound;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={onNavigate}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  rowClassName,
                  current
                    ? 'bg-popover font-semibold text-foreground dark:bg-accent'
                    : 'font-medium text-muted-foreground hover:bg-popover/60 hover:text-foreground dark:hover:bg-accent/60',
                )}
              >
                <NavIcon aria-hidden="true" className="size-[1.8rem] shrink-0" />
                {link.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

const PremiumBox = () => (
  <div className="rounded-lg bg-card p-4">
    <h2 className="text-sm font-semibold text-foreground">{PREMIUM_TITLE}</h2>
    <p className="mt-1 mb-3 text-sm text-muted-foreground">{PREMIUM_BODY}</p>
    <Button asChild size={'sm'} className="w-full">
      <Link href={PREMIUM_CTA_HREF}>{PREMIUM_CTA_LABEL}</Link>
    </Button>
  </div>
);

/** The signed-in person, the theme switch and Sign out, at the foot of the sidebar and the phone menu. */
const AccountFooter = () => {
  const { session } = useUserSession();
  const { resolvedTheme, setTheme } = useTheme();
  const { signOut, pending } = useSignOut();
  const name = session?.user.name?.trim() || null;
  const email = session?.user.email ?? '';

  return (
    <div className="flex flex-col gap-1 border-t border-input pt-4">
      {session ? (
        <div className="flex min-w-0 items-center gap-3 p-2">
          <span
            aria-hidden="true"
            className="flex size-[3.6rem] shrink-0 items-center justify-center rounded-full bg-popover text-sm font-semibold text-secondary dark:bg-accent dark:text-secondary-hover"
          >
            {accountInitials(name, email)}
          </span>
          <span className="flex min-w-0 flex-col">
            {name ? <span className="truncate text-sm font-semibold text-foreground">{name}</span> : null}
            <span className={cn('truncate', name ? 'text-xs text-muted-foreground' : 'text-sm font-semibold text-foreground')}>
              {email}
            </span>
          </span>
        </div>
      ) : null}
      {/* Both labels render; CSS shows the one for the theme you would switch to, so the server and client markup match. */}
      <button type="button" className={actionClassName} onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
        <Moon aria-hidden="true" className="size-[1.8rem] shrink-0 dark:hidden" />
        <Sun aria-hidden="true" className="hidden size-[1.8rem] shrink-0 dark:block" />
        <span className="dark:hidden">{DARK_THEME_LABEL}</span>
        <span className="hidden dark:inline">{LIGHT_THEME_LABEL}</span>
      </button>
      <button type="button" className={actionClassName} onClick={() => void signOut()} disabled={pending}>
        <LogOut aria-hidden="true" className="size-[1.8rem] shrink-0" />
        {SIGN_OUT_LABEL}
      </button>
    </div>
  );
};

const LogoWithTag = () => (
  <div className="flex items-center gap-2">
    <Logo size={'small'} />
    <BetaTag />
  </div>
);

/** Phone top bar (below md): logo, Create resume and a menu sheet with the nav and the account footer. */
const PhoneBar = () => {
  const [open, setOpen] = useState(false);
  return (
    <header className="flex h-[6.4rem] items-center gap-2 pr-2 pl-4 shadow-sm md:hidden">
      <LogoWithTag />
      <span className="flex-1" />
      <Button asChild size={'icon'} className="size-[4.4rem]">
        <Link href={CREATE_RESUME_HREF} aria-label={CREATE_RESUME_LABEL}>
          <Plus aria-hidden="true" className="size-[1.8rem]" />
        </Link>
      </Button>
      <Drawer direction="right" open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button variant={'ghost'} size={'icon'} className="size-[4.4rem]" aria-label={ACCOUNT_MENU_OPEN_LABEL}>
            <MenuIcon aria-hidden="true" className="size-[2.2rem] text-primary" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="flex h-full flex-col gap-6 px-4 py-5">
          <DrawerTitle className="sr-only">{ACCOUNT_MENU_TITLE}</DrawerTitle>
          <DrawerDescription className="sr-only">{ACCOUNT_NAV_LABEL}</DrawerDescription>
          <LogoWithTag />
          <AccountNav onNavigate={() => setOpen(false)} />
          <div className="mt-auto">
            <AccountFooter />
          </div>
        </DrawerContent>
      </Drawer>
    </header>
  );
};

export const Sidebar = () => {
  return (
    <>
      <PhoneBar />
      <aside className="sticky top-0 hidden h-screen w-[25.6rem] shrink-0 flex-col gap-6 border-r border-input px-4 py-5 md:flex">
        <div className="px-2">
          <LogoWithTag />
        </div>
        <Button asChild className="h-[4.4rem] w-full text-sm">
          <Link href={CREATE_RESUME_HREF}>
            <Plus aria-hidden="true" className="size-4" />
            {CREATE_RESUME_LABEL}
          </Link>
        </Button>
        <AccountNav />
        <div className="mt-auto flex flex-col gap-4">
          {featureFlags().creditPurchaseUi ? <PremiumBox /> : null}
          <AccountFooter />
        </div>
      </aside>
    </>
  );
};
