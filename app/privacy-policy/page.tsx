import { LegalDocument } from '@components/views';
import { privacyPolicy } from '@/lib/privacy-copy';

export default function PrivacyPolicyPage() {
  return <LegalDocument doc={privacyPolicy()} />;
}
