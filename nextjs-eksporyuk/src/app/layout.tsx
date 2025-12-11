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
    <html lang="id" className={poppins.variable}>
      <head>
        {/* Ensure CSS is loaded first */}
        <style dangerouslySetInnerHTML={{
          __html: `
            html { font-family: var(--font-poppins), system-ui, sans-serif; }
            * { box-sizing: border-box; }
            body { margin: 0; padding: 0; }
          `
        }} />
      </head>
      <body className={`${poppins.className} font-sans antialiased`}>
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
