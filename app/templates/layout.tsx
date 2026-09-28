import { Header } from "@components/views";
import { publicPageMetadata, TEMPLATES_DESCRIPTION, TEMPLATES_TITLE } from '@/lib/public-metadata';

export const metadata = publicPageMetadata('/templates', TEMPLATES_TITLE, TEMPLATES_DESCRIPTION);

export default function TemplatesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
