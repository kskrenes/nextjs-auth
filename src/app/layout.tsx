import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Header from "@/components/header";
import { AuthProvider } from "../context/AuthContext";
import { defaultTheme } from "@/helpers/themes";

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
    <html lang="en">
      <body
        className={`${robotoSans.className} antialiased`}
        style={{ 
          backgroundColor: defaultTheme.background,
          color: defaultTheme.text
        }}
      >
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
