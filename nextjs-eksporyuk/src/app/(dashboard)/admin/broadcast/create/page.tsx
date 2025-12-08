'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Send, Plus, Zap, Calendar, TrendingUp } from 'lucide-react'
import CampaignForm from '@/components/admin/CampaignForm'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'

export default function CreateCampaignPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Check auth
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
    <div className="container mx-auto px-4 py-8">
      {/* Header with Tips */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Buat Campaign Baru</h1>
        <p className="text-gray-600 mb-6">
          Buat broadcast email atau WhatsApp untuk audience yang ditargetkan
        </p>
        
        {/* Quick Tips */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Send className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">Target Audience</h3>
                <p className="text-xs text-gray-600">
                  Pilih audience berdasarkan role, membership, transaksi, atau event
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">Personalisasi</h3>
                <p className="text-xs text-gray-600">
                  Gunakan shortcode untuk personalisasi nama, email, transaksi, dll
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">Jadwalkan</h3>
                <p className="text-xs text-gray-600">
                  Simpan draft atau jadwalkan pengiriman untuk waktu yang tepat
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Form */}
      <CampaignForm
        mode="create"
        onSave={() => router.push('/admin/broadcast')}
        onCancel={() => router.push('/admin/broadcast')}
      />
    </div>
    </ResponsivePageWrapper>
  )
}
