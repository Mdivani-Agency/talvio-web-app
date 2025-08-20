import { AccountProvider } from "./providers/state-provider";
import { SessionProvider } from "@lib/providers";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-(family-var(--font-montserrat))">
      <SessionProvider fallbackURL={'/auth/sign-in'}>
        <AccountProvider>
          {children}
        </AccountProvider>
      </SessionProvider>
    </div>
  );
}
