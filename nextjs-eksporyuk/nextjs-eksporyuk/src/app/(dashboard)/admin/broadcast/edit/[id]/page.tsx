'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import CampaignForm from '@/components/admin/CampaignForm'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'

export default function EditCampaignPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [campaign, setCampaign] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Check auth
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  // Load campaign data
  useEffect(() => {
    if (session?.user?.role === 'ADMIN' && params.id) {
      loadCampaign()
    }
  }, [session, params.id])

  const loadCampaign = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/broadcast?id=${params.id}`)
      if (res.ok) {
        const data = await res.json()
        if (data.campaigns && data.campaigns.length > 0) {
          setCampaign(data.campaigns[0])
        } else {
          alert('Campaign tidak ditemukan')
          router.push('/admin/broadcast')
        }
      }
    } catch (error) {
      console.error('Failed to load campaign:', error)
      alert('Gagal memuat campaign')
      router.push('/admin/broadcast')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Campaign tidak ditemukan</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Campaign</h1>
        <p className="text-gray-600">
          Update broadcast campaign: <strong>{campaign.name}</strong>
        </p>
      </div>

      <CampaignForm
        mode="edit"
        campaign={campaign}
        onSave={() => router.push('/admin/broadcast')}
        onCancel={() => router.push('/admin/broadcast')}
      />
    </div>
    </ResponsivePageWrapper>
  )
}
