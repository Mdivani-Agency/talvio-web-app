import { Header } from "@components/views";
import { SessionProvider } from "@lib/providers";
import { PRIVATE_ROBOTS } from '@/lib/public-metadata';

export const metadata = { robots: PRIVATE_ROBOTS };

export default async function ResumeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-(family-var(--font-montserrat))">
      <SessionProvider>
        <Header className="bg-popover" />
        {children}
      </SessionProvider>
    </div>
  );
}
