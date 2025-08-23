import { Header } from "@components/views";
import { SessionProvider } from "@lib/providers";

export default function ResumeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-(family-var(--font-montserrat))">
      <SessionProvider fallbackURL={'/auth/sign-in'}>
        <Header className="bg-popover" />
        {children}
      </SessionProvider>
    </div>
  );
}
