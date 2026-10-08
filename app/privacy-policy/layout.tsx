import { PublicShell } from '@components/views';
import { PRIVACY_DESCRIPTION, PRIVACY_TITLE, publicPageMetadata } from '@/lib/public-metadata';
import { PropsWithChildren } from 'react';

export const metadata = publicPageMetadata('/privacy-policy', PRIVACY_TITLE, PRIVACY_DESCRIPTION);

export default function PrivacyPolicyLayout({ children }: Readonly<PropsWithChildren>) {
  return <PublicShell>{children}</PublicShell>;
}
