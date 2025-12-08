'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  Loader2,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
  Users,
  ShoppingBag
} from 'lucide-react'

interface EarningsData {
  overview: {
    totalEarnings: number
    monthlyEarnings: number
    pendingPayout: number
    lastPayout: number
    lastPayoutDate?: string
    growthPercent: number
  }
  breakdown: {
    courses: number
    products: number
    affiliates: number
  }
  transactions: Array<{
    id: string
    type: 'COURSE_SALE' | 'PRODUCT_SALE' | 'AFFILIATE' | 'PAYOUT'
    amount: number
    description: string
    date: string
    status: 'COMPLETED' | 'PENDING' | 'PROCESSING'
  }>
  monthlyData: Array<{
    month: string
    earnings: number
  }>
}

export default function MentorEarningsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [earnings, setEarnings] = useState<EarningsData | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      if (session?.user?.role !== 'MENTOR' && session?.user?.role !== 'ADMIN') {
        router.push('/dashboard')
        return
      }
      fetchEarnings()
    }
  }, [status, session, router])

  const fetchEarnings = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/mentor/earnings')
      if (res.ok) {
        const data = await res.json()
        setEarnings(data)
      }
    } catch (error) {
      console.error('Failed to fetch earnings:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'COURSE_SALE':
        return <BookOpen className="w-4 h-4 text-blue-600" />
      case 'PRODUCT_SALE':
        return <ShoppingBag className="w-4 h-4 text-green-600" />
      case 'AFFILIATE':
        return <Users className="w-4 h-4 text-purple-600" />
      case 'PAYOUT':
        return <ArrowUpRight className="w-4 h-4 text-orange-600" />
      default:
        return <DollarSign className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Selesai</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'PROCESSING':
        return <Badge className="bg-blue-100 text-blue-800">Diproses</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (loading) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </ResponsivePageWrapper>
    )
  }

  // Default data if no earnings yet
  const data = earnings || {
    overview: {
      totalEarnings: 0,
      monthlyEarnings: 0,
      pendingPayout: 0,
      lastPayout: 0,
      growthPercent: 0,
    },
    breakdown: {
      courses: 0,
      products: 0,
      affiliates: 0,
    },
    transactions: [],
    monthlyData: [],
  }

  return (
    <ResponsivePageWrapper>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pendapatan</h1>
            <p className="text-gray-600 mt-1">Ringkasan pendapatan dan transaksi Anda</p>
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Laporan
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Pendapatan</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatPrice(data.overview.totalEarnings)}
                  </p>
                  <div className="flex items-center mt-1">
                    {data.overview.growthPercent >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                    )}
                    <span className={`text-sm ${data.overview.growthPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(data.overview.growthPercent)}% dari bulan lalu
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Bulan Ini</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {formatPrice(data.overview.monthlyEarnings)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Menunggu Pencairan</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    {formatPrice(data.overview.pendingPayout)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Akan dicairkan
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <ArrowUpRight className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pencairan Terakhir</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {formatPrice(data.overview.lastPayout)}
                  </p>
                  {data.overview.lastPayoutDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(data.overview.lastPayoutDate)}
                    </p>
                  )}
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <ArrowDownRight className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Earnings Breakdown */}
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Sumber Pendapatan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Kursus</span>
                  </div>
                  <span className="font-bold text-blue-600">
                    {formatPrice(data.breakdown.courses)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Produk</span>
                  </div>
                  <span className="font-bold text-green-600">
                    {formatPrice(data.breakdown.products)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">Affiliate</span>
                  </div>
                  <span className="font-bold text-purple-600">
                    {formatPrice(data.breakdown.affiliates)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Transaksi Terbaru</CardTitle>
              <Button variant="outline" size="sm">
                Lihat Semua
              </Button>
            </CardHeader>
            <CardContent>
              {data.transactions.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Belum ada transaksi</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.transactions.slice(0, 5).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-full">
                          {getTransactionIcon(tx.type)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{tx.description}</p>
                          <p className="text-sm text-gray-500">{formatDate(tx.date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${tx.type === 'PAYOUT' ? 'text-red-600' : 'text-green-600'}`}>
                          {tx.type === 'PAYOUT' ? '-' : '+'}{formatPrice(tx.amount)}
                        </p>
                        {getStatusBadge(tx.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Withdraw Button */}
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold">Siap Mencairkan?</h3>
                <p className="text-blue-100 mt-1">
                  Saldo tersedia: {formatPrice(data.overview.pendingPayout)}
                </p>
              </div>
              <Button variant="secondary" size="lg">
                Cairkan Sekarang
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ResponsivePageWrapper>
  )
}
