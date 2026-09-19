import { SessionProvider } from '@lib/providers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

import { AccountProvider } from './providers/state-provider';
import { Sidebar } from './views/sidebar';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/sign-in?callbackURL=/account');
  }

  return (
    <div className="font-(family-var(--font-montserrat))">
      <SessionProvider fallbackURL={'/auth/sign-in?callbackURL=/account'}>
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
