'use client'

import { useEffect } from 'react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { useRouter } from 'next/navigation'

export default function AdminDashboardPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to main admin page
    router.replace('/admin')
  }, [router])

  return (
    <ResponsivePageWrapper>
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting to admin dashboard...</p>
    </div>
    </ResponsivePageWrapper>
  )
}