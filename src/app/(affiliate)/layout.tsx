'use client'

import { SessionProvider } from 'next-auth/react'
import DashboardLayoutClient from '@/components/layout/DashboardLayoutClient'
import AffiliateOnboardingGuard from '@/components/affiliate/AffiliateOnboardingGuard'

export default function AffiliateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <DashboardLayoutClient>
        <AffiliateOnboardingGuard>
          {children}
        </AffiliateOnboardingGuard>
      </DashboardLayoutClient>
    </SessionProvider>
  )
}
