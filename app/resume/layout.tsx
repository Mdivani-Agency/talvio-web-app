import { Header } from "@components/views";
import { SessionProvider } from "@lib/providers";
import { ResumeProvider } from "./providers/state-provider";

export default async function ResumeLayout({ children, params }: { children: React.ReactNode, params: { resumeId: string } }) {
  const { resumeId = 'new_resume' } = await params;

  return (
    <div className="font-(family-var(--font-montserrat))">
      <SessionProvider fallbackURL={'/auth/sign-in'}>
        <ResumeProvider resumeId={resumeId}>
          <Header className="bg-popover" />
          {children}
        </ResumeProvider>
      </SessionProvider>
    </div>
  );
}
