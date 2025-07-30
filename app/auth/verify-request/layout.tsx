export default function VerifyRequestLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className={'flex flex-col gap-4 justify-center items-center w-full h-screen mx-auto px-4'}>
      {children}
    </section>
  );
}
