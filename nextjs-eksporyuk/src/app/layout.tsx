import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Suspense } from "react";
import AuthProvider from "@/components/providers/auth-provider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import OneSignalProvider from "@/components/providers/OneSignalProvider";
import OnlineStatusTracker from "@/components/OnlineStatusTracker";
import AffiliateTracker from "@/components/affiliate/AffiliateTracker";
import ReactQueryProvider from "@/lib/react-query-provider";
import "./globals.css";

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap', // Optimal font loading
  preload: true,
});

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
    <html lang="id" className={poppins.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${poppins.className} font-sans antialiased bg-white text-gray-900 transition-colors duration-200`}>
        <ReactQueryProvider>
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
        </ReactQueryProvider>
      </body>
    </html>
  );
}
