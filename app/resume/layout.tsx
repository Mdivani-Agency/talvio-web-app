import { Header } from "@components/views";
import { SessionProvider } from "@lib/providers";
import { ResumeProvider } from "./providers/state-provider";

export default async function ResumeLayout({ children }: LayoutProps<'/resume'>) {
  return (
    <div className="font-(family-var(--font-montserrat))">
      <SessionProvider>
        <ResumeProvider>
          <Header className="bg-popover" />
          {children}
        </ResumeProvider>
      </SessionProvider>
    </div>
  );
}
