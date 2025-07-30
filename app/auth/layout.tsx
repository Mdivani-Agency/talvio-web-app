import { Header, StickyHeader } from "@components/views";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-(family-var(--font-montserrat))">
      <Header />
      <StickyHeader />
      {children}
    </div>
  );
}
