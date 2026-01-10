'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  RefreshCw,
  Users,
  ShoppingBag,
  CreditCard,
  Wallet,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { toast } from 'sonner'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'

interface ReportData {
  overview: {
    totalRevenue: number
    revenueGrowth: number
    totalExpenses: number
    expenseGrowth: number
    netProfit: number
    profitGrowth: number
    totalTransactions: number
    avgOrderValue: number
  }
  revenueByCategory: { category: string; amount: number; percentage: number }[]
  revenueByPeriod: { period: string; revenue: number; transactions: number }[]
  topProducts: { name: string; revenue: number; quantity: number }[]
  affiliateCommissions: { name: string; totalCommission: number; sales: number }[]
  payoutSummary: {
    pending: number
    approved: number
    paid: number
  }
}

export default function AdminReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [period, setPeriod] = useState('thisMonth')
  const [reportData, setReportData] = useState<ReportData | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  const fetchReports = useCallback(async () => {
    try {
      setRefreshing(true)
      const res = await fetch(`/api/admin/reports?period=${period}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setReportData(data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal memuat laporan')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [period])

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchReports()
    }
  }, [session, fetchReports])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0
    return (
      <span className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
        {Math.abs(growth).toFixed(1)}%
      </span>
    )
  }

  const handleExport = async (type: string) => {
    try {
      const res = await fetch(`/api/admin/reports/export?period=${period}&type=${type}`)
      if (!res.ok) throw new Error('Failed to export')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${type}-${period}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()
      toast.success('Laporan berhasil diexport')
    } catch (error) {
      toast.error('Gagal mengexport laporan')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <ResponsivePageWrapper>
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
      </ResponsivePageWrapper>
    )
  }

  if (!session || session.user?.role !== 'ADMIN') {
    return null
  }

  return (
    <ResponsivePageWrapper>
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Laporan Keuangan</h1>
          <p className="text-muted-foreground">Ringkasan pendapatan dan pengeluaran</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hari Ini</SelectItem>
              <SelectItem value="yesterday">Kemarin</SelectItem>
              <SelectItem value="thisWeek">Minggu Ini</SelectItem>
              <SelectItem value="lastWeek">Minggu Lalu</SelectItem>
              <SelectItem value="thisMonth">Bulan Ini</SelectItem>
              <SelectItem value="lastMonth">Bulan Lalu</SelectItem>
              <SelectItem value="thisYear">Tahun Ini</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchReports} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" onClick={() => handleExport('all')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(reportData?.overview.totalRevenue || 0)}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">vs periode sebelumnya</span>
              {formatGrowth(reportData?.overview.revenueGrowth || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pengeluaran</CardTitle>
            <CreditCard className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(reportData?.overview.totalExpenses || 0)}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">Komisi + Payout</span>
              {formatGrowth(-(reportData?.overview.expenseGrowth || 0))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Profit Bersih</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(reportData?.overview.netProfit || 0)}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">Setelah potongan</span>
              {formatGrowth(reportData?.overview.profitGrowth || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rata-rata Order</CardTitle>
            <ShoppingBag className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(reportData?.overview.avgOrderValue || 0)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {reportData?.overview.totalTransactions || 0} transaksi
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Pendapatan</TabsTrigger>
          <TabsTrigger value="products">Produk Terlaris</TabsTrigger>
          <TabsTrigger value="affiliate">Komisi Affiliate</TabsTrigger>
          <TabsTrigger value="payout">Payout Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Revenue by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Pendapatan per Kategori</CardTitle>
                <CardDescription>Distribusi pendapatan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData?.revenueByCategory?.length ? (
                    reportData.revenueByCategory.map((item) => (
                      <div key={item.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-primary" />
                          <span className="text-sm">{item.category}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(item.amount)}</p>
                          <p className="text-xs text-muted-foreground">{item.percentage}%</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Belum ada data</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Revenue by Period */}
            <Card>
              <CardHeader>
                <CardTitle>Trend Pendapatan</CardTitle>
                <CardDescription>Pendapatan per periode</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData?.revenueByPeriod?.length ? (
                    reportData.revenueByPeriod.map((item) => (
                      <div key={item.period} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{item.period}</p>
                          <p className="text-xs text-muted-foreground">{item.transactions} transaksi</p>
                        </div>
                        <span className="font-semibold text-green-600">{formatCurrency(item.revenue)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Belum ada data</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Produk Terlaris</CardTitle>
              <CardDescription>Produk dengan penjualan tertinggi</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData?.topProducts?.length ? (
                    reportData.topProducts.map((product, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-muted-foreground">#{idx + 1}</span>
                            <span className="font-medium">{product.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{product.quantity}</TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          {formatCurrency(product.revenue)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8">
                        <ShoppingBag className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Belum ada data</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="affiliate">
          <Card>
            <CardHeader>
              <CardTitle>Komisi Affiliate</CardTitle>
              <CardDescription>Top affiliate berdasarkan komisi</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Affiliate</TableHead>
                    <TableHead className="text-center">Sales</TableHead>
                    <TableHead className="text-right">Total Komisi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData?.affiliateCommissions?.length ? (
                    reportData.affiliateCommissions.map((aff, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-muted-foreground">#{idx + 1}</span>
                            <span className="font-medium">{aff.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{aff.sales}</TableCell>
                        <TableCell className="text-right font-semibold text-purple-600">
                          {formatCurrency(aff.totalCommission)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8">
                        <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Belum ada data</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payout">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payout</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(reportData?.payoutSummary?.pending || 0)}
                </div>
                <p className="text-xs text-muted-foreground">Menunggu approval</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(reportData?.payoutSummary?.approved || 0)}
                </div>
                <p className="text-xs text-muted-foreground">Siap diproses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Paid</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(reportData?.payoutSummary?.paid || 0)}
                </div>
                <p className="text-xs text-muted-foreground">Sudah dibayar</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </ResponsivePageWrapper>
  )
}
