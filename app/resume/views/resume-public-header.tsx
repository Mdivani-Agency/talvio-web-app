import { Header } from '@components/views';

/**
 * The public header for the `/resume` screens that are not the editor: loading, the start screen, import and the
 * unavailable states. The editor draws its own top bar.
 */
export function WithResumeHeader({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header className="bg-popover" />
      {children}
    </>
  );
}
