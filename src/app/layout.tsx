import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Header from "@/components/header";
import { AuthProvider } from "@/context-providers/auth-context-provider";
import { NaeThemeProvider } from "@/context-providers/theme-context-provider";

const robotoSans = Roboto({
  variable: "--font-roboto-sans",
  subsets: ["latin"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: 'nAuth - NextJS Auth Example | Kevin Skrenes',
  description: 'Authentication system built with Next.js, NextAuth, and MongoDB.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  openGraph: {
    title: 'nAuth - NextJS Auth Example | Kevin Skrenes',
    description: 'Authentication system built with Next.js, NextAuth, and MongoDB.',
    images: ['/og-preview.png'],
    type: 'website',
  },
  // do not index this site in any environment, it is a demo for a portfolio site
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${robotoSans.variable} ${robotoMono.variable} font-sans antialiased`}>
        <AuthProvider>
          <NaeThemeProvider>
            <Header />
            <main>{children}</main>
            <Toaster />
          </NaeThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
