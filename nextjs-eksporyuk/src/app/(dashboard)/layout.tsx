'use client'

import { SessionProvider } from 'next-auth/react'
import DashboardLayoutClient from '@/components/layout/DashboardLayoutClient'
import OnlineStatusProvider from '@/components/presence/OnlineStatusProvider'
import { MemberAccessProvider } from '@/hooks/useMemberAccess'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <MemberAccessProvider>
        <OnlineStatusProvider>
          <DashboardLayoutClient>
            {children}
          </DashboardLayoutClient>
        </OnlineStatusProvider>
      </MemberAccessProvider>
    </SessionProvider>
  )
}
