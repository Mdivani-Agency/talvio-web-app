import { SessionProvider } from '@lib/providers';
import { ACCOUNT_RETURN_HEADER, accountSignInRedirect } from '@lib/auth/sign-in-href';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { AccountProvider } from './providers/state-provider';
import { Sidebar } from './views/sidebar';

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
      <SessionProvider fallbackURL={signInURL} returnToCurrentPath>
        <AccountProvider>
          <section className="flex">
            <Sidebar />
            <section className={'h-screen w-full overflow-y-auto'}>{children}</section>
          </section>
        </AccountProvider>
      </SessionProvider>
    </div>
  );
}
