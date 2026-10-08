import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import { QueryProvider, SessionProvider, ThemeProvider } from '@lib/providers';
import { HOME_DESCRIPTION, SHARE_OPEN_GRAPH, SHARE_TWITTER } from '@/lib/public-metadata';
import { siteOrigin } from '@/lib/site';
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: "Talvio",
  description: HOME_DESCRIPTION,
  // Pages without their own metadata, such as sign-in, still share with the image.
  openGraph: SHARE_OPEN_GRAPH,
  twitter: SHARE_TWITTER,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} antialiased`}
      >
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <SessionProvider>
              {children}
            </SessionProvider>
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
