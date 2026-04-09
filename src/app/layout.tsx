import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Header from "@/components/header";
import { AuthProvider } from "../context/AuthContext";
import NaeThemeProvider from "@/themes/nae-theme-provider";

const robotoSans = Roboto({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "nAuth - NextJS Auth Example",
  description: "Authentication system built with Next.js, NextAuth, and MongoDB.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${robotoSans.className} antialiased`}>
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
