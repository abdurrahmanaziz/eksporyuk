'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, MousePointer, TrendingUp, Calendar, Target, DollarSign } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'

interface Banner {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  videoUrl: string | null
  linkUrl: string | null
  linkText: string | null
  placement: string
  displayType: string
  priority: number
  startDate: Date | null
  endDate: Date | null
  isActive: boolean
  totalViews: number
  totalClicks: number
  viewLimit: number | null
  clickLimit: number | null
  dailyBudget: number | null
  totalBudgetUsed: number
  isSponsored: boolean
  sponsorName: string | null
  createdAt: Date
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'scheduled' | 'expired'>('all')
  const [stats, setStats] = useState({
    totalBanners: 0,
    activeBanners: 0,
    totalViews: 0,
    totalClicks: 0,
    ctr: 0,
  })

  useEffect(() => {
    fetchBanners()
    fetchStats()
  }, [filter])

  const fetchBanners = async () => {
    try {
      const res = await fetch(`/api/admin/banners?filter=${filter}`)
      const data = await res.json()
      setBanners(data)
    } catch (error) {
      console.error('Error fetching banners:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/banners/stats')
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const deleteBanner = async (id: string) => {
    if (!confirm('Hapus banner ini?')) return

    try {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchBanners()
        fetchStats()
      }
    } catch (error) {
      console.error('Error deleting banner:', error)
    }
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (res.ok) {
        fetchBanners()
        fetchStats()
      }
    } catch (error) {
      console.error('Error toggling banner:', error)
    }
  }

  const getBadgeColor = (placement: string) => {
    const colors: Record<string, string> = {
      DASHBOARD: 'bg-blue-100 text-blue-700',
      FEED: 'bg-green-100 text-green-700',
      GROUP: 'bg-purple-100 text-purple-700',
      PROFILE: 'bg-pink-100 text-pink-700',
      SIDEBAR: 'bg-yellow-100 text-yellow-700',
      POPUP: 'bg-red-100 text-red-700',
      FLOATING: 'bg-indigo-100 text-indigo-700',
    }
    return colors[placement] || 'bg-gray-100 text-gray-700'
  }

  const getStatusBadge = (banner: Banner) => {
    const now = new Date()
    if (!banner.isActive) return <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">Inactive</span>
    if (banner.startDate && new Date(banner.startDate) > now) return <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700">Scheduled</span>
    if (banner.endDate && new Date(banner.endDate) < now) return <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">Expired</span>
    return <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">Active</span>
  }

  if (loading) {
    return (
      <ResponsivePageWrapper>
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Banner Management</h1>
          <p className="text-gray-600 mt-1">Kelola iklan dan banner promosi</p>
        </div>
        <Link
          href="/admin/banners/create"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          Buat Banner Baru
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Banner</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBanners}</p>
            </div>
            <Target className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeBanners}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-purple-600">{stats.totalViews.toLocaleString()}</p>
            </div>
            <Eye className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Clicks</p>
              <p className="text-2xl font-bold text-orange-600">{stats.totalClicks.toLocaleString()}</p>
            </div>
            <MousePointer className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">CTR</p>
              <p className="text-2xl font-bold text-indigo-600">{stats.ctr.toFixed(2)}%</p>
            </div>
            <DollarSign className="w-8 h-8 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          {[
            { key: 'all', label: 'Semua' },
            { key: 'active', label: 'Active' },
            { key: 'inactive', label: 'Inactive' },
            { key: 'scheduled', label: 'Scheduled' },
            { key: 'expired', label: 'Expired' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-6 py-3 font-medium transition ${
                filter === tab.key
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Banners List */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        {banners.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Belum ada banner</p>
            <Link
              href="/admin/banners/create"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Buat Banner Pertama
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preview</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title & Info</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Placement</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Schedule</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {banners.map((banner) => (
                  <tr key={banner.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {banner.imageUrl ? (
                        <Image
                          src={banner.imageUrl}
                          alt={banner.title}
                          width={80}
                          height={60}
                          className="rounded object-cover"
                        />
                      ) : (
                        <div className="w-20 h-15 bg-gray-200 rounded flex items-center justify-center">
                          <Target className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{banner.title}</p>
                        {banner.description && (
                          <p className="text-sm text-gray-500 line-clamp-1">{banner.description}</p>
                        )}
                        {banner.isSponsored && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700">
                            <DollarSign className="w-3 h-3" />
                            {banner.sponsorName || 'Sponsored'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded ${getBadgeColor(banner.placement)}`}>
                        {banner.placement}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {banner.startDate && (
                          <p className="text-gray-600">
                            Start: {new Date(banner.startDate).toLocaleDateString('id-ID')}
                          </p>
                        )}
                        {banner.endDate && (
                          <p className="text-gray-600">
                            End: {new Date(banner.endDate).toLocaleDateString('id-ID')}
                          </p>
                        )}
                        {!banner.startDate && !banner.endDate && (
                          <p className="text-gray-400">No schedule</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Eye className="w-4 h-4" />
                          <span>{banner.totalViews.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MousePointer className="w-4 h-4" />
                          <span>{banner.totalClicks.toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          CTR: {banner.totalViews > 0 ? ((banner.totalClicks / banner.totalViews) * 100).toFixed(2) : 0}%
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(banner)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleActive(banner.id, banner.isActive)}
                          className={`p-2 rounded hover:bg-gray-100 ${
                            banner.isActive ? 'text-green-600' : 'text-gray-400'
                          }`}
                          title={banner.isActive ? 'Deactivate' : 'Activate'}
                        >
                          <TrendingUp className="w-4 h-4" />
                        </button>
                        <Link
                          href={`/admin/banners/${banner.id}/edit`}
                          className="p-2 rounded hover:bg-gray-100 text-blue-600"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => deleteBanner(banner.id)}
                          className="p-2 rounded hover:bg-gray-100 text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </ResponsivePageWrapper>
  )
}
