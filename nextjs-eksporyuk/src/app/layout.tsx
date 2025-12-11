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
        {/* Critical CSS loading */}
        <link rel="stylesheet" href="/critical.css" />
        
        {/* Ensure CSS is loaded first */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
          as="style"
          onLoad="this.onload=null;this.rel='stylesheet'"
        />
        <noscript>
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
          />
        </noscript>
        
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Immediate font loading */
            html, body { 
              font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
              margin: 0;
              padding: 0;
            }
            * { box-sizing: border-box; }
            
            /* Emergency fallback if CSS doesn't load */
            .min-h-screen { min-height: 100vh; }
            .bg-white { background-color: #ffffff; }
            .font-poppins { font-family: 'Poppins', sans-serif !important; }
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
