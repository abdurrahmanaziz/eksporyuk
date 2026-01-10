'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Send, 
  Plus, 
  Edit, 
  Trash2, 
  TrendingUp,
  Filter,
  Calendar,
  Clock
} from 'lucide-react'
import BroadcastAnalytics from '@/components/admin/BroadcastAnalytics'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'

export default function AdminBroadcastPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [mainView, setMainView] = useState<'list' | 'analytics'>('list')
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentCampaign, setCurrentCampaign] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')

  // Check auth
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  // Load campaigns
  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      loadCampaigns()
    }
  }, [session, statusFilter, typeFilter])

  const loadCampaigns = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        type: typeFilter,
      })

      const res = await fetch(`/api/admin/broadcast?${params}`)
      if (res.ok) {
        const data = await res.json()
        setCampaigns(data.campaigns || [])
      }
    } catch (error) {
      console.error('Failed to load campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCampaign = () => {
    router.push('/admin/broadcast/create')
  }

  const handleEditCampaign = (campaign: any) => {
    router.push(`/admin/broadcast/edit/${campaign.id}`)
  }

  const handleViewAnalytics = (campaign: any) => {
    setCurrentCampaign(campaign)
    setMainView('analytics')
  }

  const handleSendCampaign = async (id: string) => {
    if (!confirm('Kirim campaign sekarang?')) return

    try {
      const res = await fetch(`/api/admin/broadcast/${id}/send`, {
        method: 'POST',
      })

      if (res.ok) {
        alert('Campaign berhasil dikirim!')
        loadCampaigns()
      } else {
        alert('Gagal mengirim campaign')
      }
    } catch (error) {
      console.error('Failed to send campaign:', error)
      alert('Gagal mengirim campaign')
    }
  }

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Hapus campaign ini?')) return

    try {
      const res = await fetch(`/api/admin/broadcast/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        alert('Campaign berhasil dihapus')
        loadCampaigns()
      } else {
        alert('Gagal menghapus campaign')
      }
    } catch (error) {
      console.error('Failed to delete campaign:', error)
      alert('Gagal menghapus campaign')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'SENDING':
        return 'bg-blue-100 text-blue-800'
      case 'SCHEDULED':
        return 'bg-yellow-100 text-yellow-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <ResponsivePageWrapper>
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Broadcast Management</h1>
        <p className="text-gray-600">
          Kelola campaign email & WhatsApp blast dengan tracking lengkap
        </p>
      </div>

      {/* Main Content */}
      {mainView === 'list' && (
        <div>
          {/* Actions & Filters */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <button
              onClick={handleCreateCampaign}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Buat Campaign Baru
            </button>

            <div className="flex flex-wrap gap-3">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="SENDING">Sending</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
              </select>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Types</option>
                <option value="EMAIL">Email</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="BOTH">Both</option>
              </select>
            </div>
          </div>

          {/* Campaign List */}
          {campaigns.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Send className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum Ada Campaign</h3>
              <p className="text-gray-600 mb-4">
                Buat campaign pertama untuk mulai broadcast ke users
              </p>
              <button
                onClick={handleCreateCampaign}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Buat Campaign
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {campaign.name}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                          {campaign.type}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded">
                          {campaign.targetType}
                        </span>
                      </div>
                      
                      {campaign.emailSubject && (
                        <p className="text-sm text-gray-600 mb-3">
                          <strong>Subject:</strong> {campaign.emailSubject}
                        </p>
                      )}
                      
                      {/* Scheduled Info */}
                      {campaign.status === 'SCHEDULED' && campaign.scheduledAt && (
                        <div className="flex items-center gap-2 mb-3 text-sm bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                          <Clock className="w-4 h-4 text-yellow-600" />
                          <span className="text-yellow-800">
                            Dijadwalkan: <strong>{new Date(campaign.scheduledAt).toLocaleString('id-ID', { 
                              dateStyle: 'medium', 
                              timeStyle: 'short' 
                            })}</strong>
                          </span>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-3 text-sm">
                        <div>
                          <span className="text-gray-500">Target:</span>
                          <span className="ml-2 font-semibold text-gray-900">{campaign.totalRecipients}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Sent:</span>
                          <span className="ml-2 font-semibold text-blue-600">{campaign.sentCount}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Opened:</span>
                          <span className="ml-2 font-semibold text-purple-600">{campaign.openedCount}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Clicked:</span>
                          <span className="ml-2 font-semibold text-orange-600">{campaign.clickedCount}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Failed:</span>
                          <span className="ml-2 font-semibold text-red-600">{campaign.failedCount}</span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 mt-3 flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Created: {new Date(campaign.createdAt).toLocaleDateString('id-ID')}
                        </span>
                        {campaign.sentAt && (
                          <span className="flex items-center gap-1 text-green-600">
                            <Send className="w-3 h-3" />
                            Sent: {new Date(campaign.sentAt).toLocaleDateString('id-ID')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {/* View Analytics */}
                      <button
                        onClick={() => handleViewAnalytics(campaign)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Analytics"
                      >
                        <TrendingUp className="w-4 h-4" />
                      </button>
                      
                      {(campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED') && (
                        <>
                          <button
                            onClick={() => handleSendCampaign(campaign.id)}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Kirim Sekarang"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditCampaign(campaign)}
                            className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {campaign.status !== 'SENDING' && (
                        <button
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* View Analytics */}
      {mainView === 'analytics' && currentCampaign && (
        <div>
          <button
            onClick={() => setMainView('list')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke List
          </button>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentCampaign.name}</h2>
            <p className="text-gray-600">Campaign Analytics & Performance</p>
          </div>
          <BroadcastAnalytics campaign={currentCampaign} />
        </div>
      )}
    </div>
    </ResponsivePageWrapper>
  )
}
