'use client'

import { SessionProvider } from 'next-auth/react'
import DashboardLayoutClient from '@/components/layout/DashboardLayoutClient'

export default function AffiliateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <DashboardLayoutClient>
        {children}
      </DashboardLayoutClient>
    </SessionProvider>
  )
}
