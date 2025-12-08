import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import AuthProvider from "@/components/providers/auth-provider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import OneSignalProvider from "@/components/providers/OneSignalProvider";
import OnlineStatusTracker from "@/components/OnlineStatusTracker";
import AffiliateTracker from "@/components/affiliate/AffiliateTracker";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Eksporyuk - Platform Komunitas & Membership",
  description: "Platform lengkap untuk komunitas, membership, dan affiliate marketing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <AuthProvider>
          <OneSignalProvider />
          <SettingsProvider>
            {/* Global Affiliate Tracker - captures ?ref=CODE on any page */}
            <Suspense fallback={null}>
              <AffiliateTracker />
            </Suspense>
            {/* <OnlineStatusTracker /> */}
            <ToastProvider />
            {children}
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
