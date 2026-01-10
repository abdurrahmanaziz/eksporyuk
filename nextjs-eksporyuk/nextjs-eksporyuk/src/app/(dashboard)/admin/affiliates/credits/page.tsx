'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Search,
  Loader2,
  Plus,
  Users,
  DollarSign,
  RefreshCw,
  Mail,
  AlertCircle,
  ExternalLink,
  FileText,
  Calendar,
  CreditCard,
} from 'lucide-react'
import { toast } from 'sonner'

interface CreditData {
  id: string
  affiliateId: string
  balance: number
  totalTopUp: number
  totalUsed: number
  affiliate: {
    id: string
    affiliateCode: string
    user: {
      name: string
      email: string
    }
  }
}

interface Stats {
  totalBalance: number
  totalTopUp: number
  totalUsed: number
  totalAffiliates: number
}

interface MailketingBalance {
  balance: number
  email_credits: number
  sms_credits: number
  wa_credits: number
  currency: string
  user: string
  expires_at: string | null
}

interface SalesTransaction {
  id: string
  invoiceNumber: string
  user: {
    id: string
    name: string
    email: string
    phone: string | null
  }
  credits: number
  packageName: string
  amount: number
  status: string
  paymentMethod: string | null
  paymentProvider: string | null
  reference: string | null
  createdAt: string
  paidAt: string | null
}

interface SalesStats {
  totalRevenue: number
  totalCredits: number
  totalTransactions: number
  today: {
    sales: number
    revenue: number
  }
  thisMonth: {
    sales: number
    revenue: number
  }
}

export default function AdminAffiliateCreditsPage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [credits, setCredits] = useState<CreditData[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedAffiliate, setSelectedAffiliate] = useState<CreditData | null>(null)
  const [activeTab, setActiveTab] = useState('credits')
  
  // Mailketing balance state
  const [mailketingBalance, setMailketingBalance] = useState<MailketingBalance | null>(null)
  const [mailketingLoading, setMailketingLoading] = useState(true)
  const [mailketingError, setMailketingError] = useState<string | null>(null)
  
  // Xendit balance state
  const [xenditBalance, setXenditBalance] = useState<any>(null)
  const [xenditLoading, setXenditLoading] = useState(true)
  const [xenditError, setXenditError] = useState<string | null>(null)
  
  // Sales report state
  const [salesTransactions, setSalesTransactions] = useState<SalesTransaction[]>([])
  const [salesStats, setSalesStats] = useState<SalesStats | null>(null)
  const [salesLoading, setSalesLoading] = useState(false)
  const [salesFilter, setSalesFilter] = useState('all')
  
  const [formData, setFormData] = useState({
    type: 'TOPUP',
    amount: '',
    description: '',
  })

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCredits()
      fetchMailketingBalance()
      fetchXenditBalance()
    }
  }, [status])

  useEffect(() => {
    if (activeTab === 'sales' && status === 'authenticated') {
      fetchSalesReport()
    }
  }, [activeTab, status, salesFilter])

  const fetchCredits = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/affiliate/credits')
      const data = await res.json()

      if (res.ok) {
        setCredits(data.credits)
        setStats(data.stats)
      } else {
        toast.error(data.error || 'Failed to load credits')
      }
    } catch (error) {
      console.error('Error fetching credits:', error)
      toast.error('Failed to load credits')
    } finally {
      setLoading(false)
    }
  }

  const fetchMailketingBalance = async () => {
    try {
      setMailketingLoading(true)
      setMailketingError(null)
      const res = await fetch('/api/admin/mailketing/balance')
      const data = await res.json()

      if (data.success) {
        setMailketingBalance(data.data)
      } else {
        setMailketingError(data.message || 'Gagal mengambil balance Mailketing')
      }
    } catch (error) {
      console.error('Error fetching Mailketing balance:', error)
      setMailketingError('Gagal mengambil balance Mailketing')
    } finally {
      setMailketingLoading(false)
    }
  }

  const fetchXenditBalance = async () => {
    try {
      setXenditLoading(true)
      setXenditError(null)
      const res = await fetch('/api/admin/xendit/balance')
      const data = await res.json()

      if (data.success) {
        setXenditBalance(data.data)
      } else {
        setXenditError(data.message || 'Gagal mengambil balance Xendit')
      }
    } catch (error) {
      console.error('Error fetching Xendit balance:', error)
      setXenditError('Gagal mengambil balance Xendit')
    } finally {
      setXenditLoading(false)
    }
  }

  const fetchSalesReport = async () => {
    try {
      setSalesLoading(true)
      const res = await fetch(`/api/admin/affiliate/credit-sales?status=${salesFilter}&limit=100`)
      const data = await res.json()

      if (res.ok) {
        setSalesTransactions(data.transactions)
        setSalesStats(data.stats)
      } else {
        toast.error(data.error || 'Failed to load sales report')
      }
    } catch (error) {
      console.error('Error fetching sales report:', error)
      toast.error('Failed to load sales report')
    } finally {
      setSalesLoading(false)
    }
  }

  const handleOpenModal = (credit: CreditData) => {
    setSelectedAffiliate(credit)
    setFormData({
      type: 'TOPUP',
      amount: '',
      description: '',
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    try {
      if (!selectedAffiliate || !formData.amount) {
        toast.error('Please enter amount')
        return
      }

      setSaving(true)

      const res = await fetch('/api/admin/affiliate/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliateId: selectedAffiliate.affiliateId,
          type: formData.type,
          amount: parseInt(formData.amount),
          description: formData.description,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(`Successfully ${formData.type.toLowerCase()}ed ${formData.amount} credits`)
        setShowModal(false)
        fetchCredits()
      } else {
        toast.error(data.error || 'Failed to update credits')
      }
    } catch (error) {
      console.error('Error updating credits:', error)
      toast.error('Failed to update credits')
    } finally {
      setSaving(false)
    }
  }

  const filteredCredits = credits.filter((credit) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      credit.affiliate.user.name.toLowerCase().includes(searchLower) ||
      credit.affiliate.user.email.toLowerCase().includes(searchLower) ||
      credit.affiliate.affiliateCode.toLowerCase().includes(searchLower)
    )
  })

  if (status === 'loading' || loading) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Coins className="w-8 h-8 text-blue-600" />
            Kelola Kredit Affiliate
          </h1>
          <p className="text-gray-600">
            Kelola saldo kredit broadcast email untuk semua affiliate
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Affiliate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats?.totalAffiliates || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Saldo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {stats?.totalBalance?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-gray-500">kredit</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Top Up
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {stats?.totalTopUp?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-gray-500">kredit</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Terpakai
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">
                {stats?.totalUsed?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-gray-500">kredit</p>
            </CardContent>
          </Card>
        </div>

        {/* Mailketing Balance Card */}
        <Card className="mb-8 border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600 rounded-lg">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-purple-800">
                    Kredit Mailketing
                  </CardTitle>
                  <CardDescription>
                    Kredit email dari Mailketing.co.id untuk broadcast affiliate
                  </CardDescription>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchMailketingBalance}
                disabled={mailketingLoading}
                className="border-purple-300 text-purple-600 hover:bg-purple-100"
              >
                {mailketingLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {mailketingLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                <span className="ml-2 text-gray-600">Mengambil balance...</span>
              </div>
            ) : mailketingError ? (
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-amber-800 font-medium">Tidak dapat mengambil balance</p>
                  <p className="text-amber-700 text-sm">{mailketingError instanceof Error ? mailketingError.message : String(mailketingError)}</p>
                  <a 
                    href="/admin/integrations" 
                    className="text-sm text-purple-600 hover:underline flex items-center gap-1 mt-2"
                  >
                    Konfigurasi di halaman Integrasi <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ) : mailketingBalance ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-lg border border-purple-200 shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Total Email Credits</p>
                  <p className="text-4xl font-bold text-purple-600">
                    {mailketingBalance.email_credits.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Kredit tersedia untuk broadcast email</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Akun Terhubung</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {mailketingBalance.user || '-'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Email akun Mailketing</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                Tidak ada data balance
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-purple-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                💡 Kredit Mailketing digunakan untuk mengirim broadcast email affiliate
              </p>
              <a 
                href="https://be.mailketing.co.id/dashboard" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-purple-600 hover:underline flex items-center gap-1"
              >
                Top Up di Mailketing <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Xendit Balance Card */}
        <Card className="mb-8 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600 rounded-lg">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-blue-900">Saldo Xendit</CardTitle>
                  <CardDescription>Balance payment gateway</CardDescription>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchXenditBalance}
                disabled={xenditLoading}
              >
                <RefreshCw className={`w-4 h-4 ${xenditLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {xenditLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : xenditError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800">Gagal Memuat Balance</p>
                    <p className="text-sm text-red-600 mt-1">{xenditError instanceof Error ? xenditError.message : String(xenditError)}</p>
                    {(xenditError instanceof Error ? xenditError.message : String(xenditError)).includes('tidak dikonfigurasi') && (
                      <a 
                        href="/admin/integrations" 
                        className="text-sm text-red-700 hover:underline flex items-center gap-1 mt-2 font-medium"
                      >
                        Konfigurasi Xendit di halaman Integrasi <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : xenditBalance ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-lg border border-blue-200 shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Available Balance</p>
                  <p className="text-4xl font-bold text-blue-600">
                    Rp {(xenditBalance.balance || 0).toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Saldo tersedia untuk transaksi</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Account Type</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {xenditBalance.accountType || 'CASH'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Tipe akun Xendit</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                Tidak ada data balance
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-blue-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                💳 Saldo Xendit digunakan untuk pembayaran otomatis (Virtual Account, E-Wallet, dll)
              </p>
              <a 
                href="https://dashboard.xendit.co/balance" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                Lihat di Xendit <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Credit Management and Sales Report */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="credits" className="flex items-center gap-2">
              <Coins className="w-4 h-4" />
              Kelola Kredit
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Laporan Penjualan
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Credit Management */}
          <TabsContent value="credits" className="space-y-6">
            {/* Search & Filter */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      placeholder="Cari affiliate..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" onClick={fetchCredits}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Credits List */}
            <Card>
              <CardHeader>
                <CardTitle>Daftar Kredit Affiliate</CardTitle>
                <CardDescription>
                  Klik pada affiliate untuk menambah atau mengurangi kredit
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredCredits.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Belum ada data kredit affiliate</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-4">Affiliate</th>
                          <th className="text-left p-4">Kode</th>
                          <th className="text-right p-4">Saldo</th>
                          <th className="text-right p-4">Top Up</th>
                          <th className="text-right p-4">Terpakai</th>
                          <th className="text-center p-4">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCredits.map((credit) => (
                          <tr key={credit.id} className="border-b hover:bg-gray-50">
                            <td className="p-4">
                              <div>
                                <p className="font-medium">{credit.affiliate.user.name}</p>
                                <p className="text-sm text-gray-500">{credit.affiliate.user.email}</p>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge variant="outline">{credit.affiliate.affiliateCode}</Badge>
                            </td>
                            <td className="p-4 text-right">
                              <span className="font-bold text-blue-600">
                                {credit.balance.toLocaleString()}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <span className="text-green-600">
                                +{credit.totalTopUp.toLocaleString()}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <span className="text-orange-600">
                                -{credit.totalUsed.toLocaleString()}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenModal(credit)}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Kelola
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Sales Report */}
          <TabsContent value="sales" className="space-y-6">
            {/* Sales Stats */}
            {salesStats && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Total Pendapatan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">
                      Rp {salesStats.totalRevenue.toLocaleString('id-ID')}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Total Transaksi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-blue-600">
                      {salesStats.totalTransactions}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Total Kredit Terjual
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-purple-600">
                      {salesStats.totalCredits.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Hari Ini
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold">{salesStats.today.sales} transaksi</p>
                    <p className="text-sm text-gray-500">
                      Rp {salesStats.today.revenue.toLocaleString('id-ID')}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Bulan Ini
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold">{salesStats.thisMonth.sales} transaksi</p>
                    <p className="text-sm text-gray-500">
                      Rp {salesStats.thisMonth.revenue.toLocaleString('id-ID')}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Sales Filter and Refresh */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Select value={salesFilter} onValueChange={setSalesFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="success">Berhasil</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Gagal</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={fetchSalesReport} disabled={salesLoading}>
                    {salesLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Sales Transactions List */}
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Penjualan Kredit</CardTitle>
                <CardDescription>
                  Daftar transaksi pembelian kredit oleh affiliate
                </CardDescription>
              </CardHeader>
              <CardContent>
                {salesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : salesTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Belum ada transaksi penjualan kredit</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-4">Invoice</th>
                          <th className="text-left p-4">Affiliate</th>
                          <th className="text-left p-4">Paket</th>
                          <th className="text-right p-4">Kredit</th>
                          <th className="text-right p-4">Harga</th>
                          <th className="text-center p-4">Status</th>
                          <th className="text-left p-4">Tanggal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesTransactions.map((transaction) => (
                          <tr key={transaction.id} className="border-b hover:bg-gray-50">
                            <td className="p-4">
                              <p className="font-mono text-sm">{transaction.invoiceNumber}</p>
                              {transaction.reference && (
                                <p className="text-xs text-gray-500">{transaction.reference}</p>
                              )}
                            </td>
                            <td className="p-4">
                              <div>
                                <p className="font-medium">{transaction.user.name}</p>
                                <p className="text-sm text-gray-500">{transaction.user.email}</p>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge variant="outline">{transaction.packageName}</Badge>
                            </td>
                            <td className="p-4 text-right">
                              <span className="font-bold text-purple-600">
                                {transaction.credits.toLocaleString()}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <span className="font-semibold text-green-600">
                                Rp {transaction.amount.toLocaleString('id-ID')}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <Badge
                                variant={
                                  transaction.status === 'SUCCESS'
                                    ? 'default'
                                    : transaction.status === 'PENDING'
                                    ? 'secondary'
                                    : 'destructive'
                                }
                              >
                                {transaction.status === 'SUCCESS' && '✓ Berhasil'}
                                {transaction.status === 'PENDING' && '⏳ Pending'}
                                {transaction.status === 'FAILED' && '✗ Gagal'}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <p className="text-sm">
                                {new Date(transaction.createdAt).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                              {transaction.paidAt && transaction.status === 'SUCCESS' && (
                                <p className="text-xs text-gray-500">
                                  Dibayar: {new Date(transaction.paidAt).toLocaleDateString('id-ID')}
                                </p>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Manage Credits Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kelola Kredit</DialogTitle>
              <DialogDescription>
                {selectedAffiliate && (
                  <>
                    {selectedAffiliate.affiliate.user.name} ({selectedAffiliate.affiliate.affiliateCode})
                    <br />
                    Saldo saat ini: <strong>{selectedAffiliate.balance} kredit</strong>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Tipe Transaksi</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TOPUP">Top Up (Tambah)</SelectItem>
                    <SelectItem value="DEDUCT">Deduct (Kurangi)</SelectItem>
                    <SelectItem value="REFUND">Refund (Pengembalian)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Jumlah Kredit</Label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Masukkan jumlah kredit"
                />
              </div>

              <div>
                <Label>Keterangan (Opsional)</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="contoh: Bonus promo, Refund broadcast gagal"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Batal
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {formData.type === 'TOPUP' && <TrendingUp className="w-4 h-4 mr-2" />}
                {formData.type === 'DEDUCT' && <TrendingDown className="w-4 h-4 mr-2" />}
                {formData.type === 'REFUND' && <RefreshCw className="w-4 h-4 mr-2" />}
                Proses
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ResponsivePageWrapper>
  )
}
