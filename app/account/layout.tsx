import { AccountProvider } from "./providers/state-provider";
import { SessionProvider } from "@lib/providers";
import { Sidebar } from "./views/sidebar";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-(family-var(--font-montserrat))">
      <SessionProvider fallbackURL={'/auth/sign-in'}>
        <AccountProvider>
          <section className="flex">
            <Sidebar />
            <section className={'h-screen w-full overflow-y-auto'}>
              {children}
            </section>
          </section>
        </AccountProvider>
      </SessionProvider>
    </div>
  );
}
