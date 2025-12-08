'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'

/**
 * REDIRECT PAGE
 * Campaign management sudah terintegrasi di Templates > Broadcast
 * Redirect ke halaman tersebut untuk menghindari duplikasi menu
 */
export default function AdminCampaignsPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect ke Broadcast page
    router.replace('/admin/broadcast')
  }, [router])

  return (
    <ResponsivePageWrapper>
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Mengalihkan ke Broadcast Management...</p>
      </div>
    </div>
    </ResponsivePageWrapper>
  )
}
