'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Building2, 
  Package, 
  Users, 
  ShoppingBag, 
  FileCheck, 
  TrendingUp,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  ShieldCheck
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface SupplierStats {
  totalSuppliers: number
  totalPackages: number
  totalProducts: number
  totalUsers: number
  pendingVerifications: number
  activeSubscriptions: number
  totalRevenue: number
  authorizedMentors: number
}

export default function SupplierDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<SupplierStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/supplier/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching supplier stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickLinks = [
    {
      title: 'Paket Supplier',
      description: 'Kelola paket langganan supplier',
      icon: Package,
      href: '/admin/supplier/packages',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Pengguna Supplier',
      description: 'Lihat dan kelola pengguna supplier',
      icon: Users,
      href: '/admin/supplier/users',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Produk Supplier',
      description: 'Katalog produk dari supplier',
      icon: ShoppingBag,
      href: '/admin/supplier/products',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Authorized Mentors',
      description: 'Kelola mentor yang berwenang review',
      icon: ShieldCheck,
      href: '/admin/supplier/authorized-mentors',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Verifikasi Supplier',
      description: 'Proses verifikasi supplier baru',
      icon: FileCheck,
      href: '/admin/supplier/verifications',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ]

  const statCards = [
    {
      title: 'Total Supplier',
      value: stats?.totalSuppliers || 0,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Paket',
      value: stats?.totalPackages || 0,
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Produk',
      value: stats?.totalProducts || 0,
      icon: ShoppingBag,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Pengguna Supplier',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Langganan Aktif',
      value: stats?.activeSubscriptions || 0,
      icon: CheckCircle,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
    },
    {
      title: 'Pending Verifikasi',
      value: stats?.pendingVerifications || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Authorized Mentors',
      value: stats?.authorizedMentors || 0,
      icon: ShieldCheck,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Total Revenue',
      value: `Rp ${(stats?.totalRevenue || 0).toLocaleString('id-ID')}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sistem Supplier</h1>
            <p className="text-gray-600 mt-1">
              Kelola paket, produk, dan verifikasi supplier Anda
            </p>
          </div>
          <Button
            onClick={() => router.push('/admin/supplier/packages/create')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Package className="w-4 h-4 mr-2" />
            Buat Paket Baru
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))
          ) : (
            statCards.map((stat, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Akses Cepat</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.map((link, index) => (
              <Card 
                key={index}
                className="hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => router.push(link.href)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                        {link.title}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {link.description}
                      </CardDescription>
                    </div>
                    <div className={`p-3 rounded-lg ${link.bgColor}`}>
                      <link.icon className={`w-6 h-6 ${link.color}`} />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
            <CardDescription>
              Informasi terbaru dari sistem supplier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Aktivitas akan ditampilkan di sini</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
