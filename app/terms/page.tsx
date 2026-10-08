import { LegalDocument } from '@components/views';
import { TERMS } from '@/lib/terms-copy';

export default function TermsOfServicePage() {
  return <LegalDocument doc={TERMS} />;
}
