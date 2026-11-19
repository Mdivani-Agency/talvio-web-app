import { PublicShell } from '@components/views';
import { publicPageMetadata, SHARE_IMAGE_TEMPLATES, TEMPLATES_DESCRIPTION, TEMPLATES_TITLE } from '@/lib/public-metadata';

export const metadata = publicPageMetadata('/templates', TEMPLATES_TITLE, TEMPLATES_DESCRIPTION, SHARE_IMAGE_TEMPLATES);

export default function TemplatesLayout({ children }: { children: React.ReactNode }) {
  return <PublicShell>{children}</PublicShell>;
}
