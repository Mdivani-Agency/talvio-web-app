import { Header } from "@components/views";
import { SessionProvider } from "@lib/providers";

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
