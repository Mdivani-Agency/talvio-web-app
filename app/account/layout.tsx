import { ResponsiveHeader } from "./views";
import { SessionProvider } from "@lib/providers";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-(family-var(--font-montserrat))">
      <SessionProvider fallbackURL={'/auth/sign-in'}>
        <ResponsiveHeader />
        {children}
      </SessionProvider>
    </div>
  );
}
