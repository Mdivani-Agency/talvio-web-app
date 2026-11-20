import { SessionProvider } from "@lib/providers";
import { PRIVATE_ROBOTS } from '@/lib/public-metadata';

import { FeedbackPromptProvider } from './providers/feedback-prompt-provider';

export const metadata = { robots: PRIVATE_ROBOTS };

export default async function ResumeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-(family-var(--font-montserrat))">
      <SessionProvider>
        <FeedbackPromptProvider>{children}</FeedbackPromptProvider>
      </SessionProvider>
    </div>
  );
}
