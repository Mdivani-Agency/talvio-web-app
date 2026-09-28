import { Header, StickyHeader } from "@components/views";
import { PRIVATE_ROBOTS } from '@/lib/public-metadata';

export const metadata = { robots: PRIVATE_ROBOTS };

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-(family-var(--font-montserrat))">
      <Header />
      <StickyHeader />
      {children}
    </div>
  );
}
