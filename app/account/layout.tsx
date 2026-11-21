import { PRIVATE_ROBOTS } from '@/lib/public-metadata';
import { SessionProvider } from '@lib/providers';
import { ACCOUNT_RETURN_HEADER, accountSignInRedirect } from '@lib/auth/sign-in-href';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { AccountProvider } from './providers/state-provider';
import { AccountShellSkeleton } from './views/account-skeleton';
import { Sidebar } from './views/sidebar';

export const metadata = { robots: PRIVATE_ROBOTS };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const headerStore = await headers();
  const signInURL = accountSignInRedirect(headerStore.get(ACCOUNT_RETURN_HEADER));

  if (!user) {
    redirect(signInURL);
  }

  return (
    <div className="font-(family-var(--font-montserrat))">
      <SessionProvider fallbackURL={signInURL} returnToCurrentPath pending={<AccountShellSkeleton />}>
        <AccountProvider>
          <div className="flex min-h-screen min-w-0 flex-col md:flex-row">
            <Sidebar />
            <main className={'w-full min-w-0 md:h-screen md:overflow-y-auto'}>{children}</main>
          </div>
        </AccountProvider>
      </SessionProvider>
    </div>
  );
}
