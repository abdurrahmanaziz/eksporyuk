'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import {
  Coins,
  Search,
  TrendingUp,
  TrendingDown,
  Users,
  Loader2,
  Plus,
  Minus,
  RotateCcw,
  Eye,
  Filter,
  Download,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CreditAccount {
  id: string
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

export default function AdminAffiliateCreditsPage() {
  const [loading, setLoading] = useState(true)
  const [credits, setCredits] = useState<CreditAccount[]>([])
  const [filteredCredits, setFilteredCredits] = useState<CreditAccount[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'active' | 'low'>('all')
  
  // Manage credit modal
  const [manageCreditModal, setManageCreditModal] = useState(false)
  const [selectedAffiliate, setSelectedAffiliate] = useState<CreditAccount | null>(null)
  const [creditAction, setCreditAction] = useState<'TOPUP' | 'DEDUCT' | 'REFUND'>('TOPUP')
  const [creditAmount, setCreditAmount] = useState('')
  const [creditDescription, setCreditDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchCredits()
  }, [])

  useEffect(() => {
    filterCredits()
  }, [searchQuery, filterType, credits])

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

  const filterCredits = () => {
    let filtered = credits

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.affiliate.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.affiliate.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.affiliate.affiliateCode.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Type filter
    if (filterType === 'active') {
      filtered = filtered.filter(c => c.balance > 0)
    } else if (filterType === 'low') {
      filtered = filtered.filter(c => c.balance < 50 && c.balance > 0)
    }

    setFilteredCredits(filtered)
  }

  const handleManageCredit = (affiliate: CreditAccount) => {
    setSelectedAffiliate(affiliate)
    setCreditAmount('')
    setCreditDescription('')
    setManageCreditModal(true)
  }

  const handleSubmitCredit = async () => {
    if (!selectedAffiliate || !creditAmount || parseInt(creditAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    try {
      setSubmitting(true)

      const res = await fetch('/api/admin/affiliate/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliateId: selectedAffiliate.affiliate.id,
          amount: parseInt(creditAmount),
          type: creditAction,
          description: creditDescription || `Admin ${creditAction.toLowerCase()}: ${creditAmount} credits`,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(`Successfully ${creditAction.toLowerCase()}ed ${creditAmount} credits`)
        setManageCreditModal(false)
        fetchCredits()
      } else {
        toast.error(data.error || 'Failed to update credits')
      }
    } catch (error) {
      console.error('Error updating credits:', error)
      toast.error('Failed to update credits')
    } finally {
      setSubmitting(false)
    }
  }

  const exportToCSV = () => {
    const csvContent = [
      ['Name', 'Email', 'Affiliate Code', 'Balance', 'Total Top Up', 'Total Used'],
      ...filteredCredits.map(c => [
        c.affiliate.user.name,
        c.affiliate.user.email,
        c.affiliate.affiliateCode,
        c.balance,
        c.totalTopUp,
        c.totalUsed,
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `affiliate-credits-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    toast.success('Credits exported to CSV')
  }

  if (loading) {
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
            Pantau dan kelola kredit broadcast email semua affiliate
          </p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Affiliate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-blue-600">
                    {stats.totalAffiliates}
                  </span>
                  <Users className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-green-600">
                    {stats.totalBalance.toLocaleString()}
                  </span>
                  <span className="text-gray-500">kredit</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Top Up
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-purple-600">
                    {stats.totalTopUp.toLocaleString()}
                  </span>
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Used
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-orange-600">
                    {stats.totalUsed.toLocaleString()}
                  </span>
                  <TrendingDown className="w-5 h-5 text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters & Actions */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Cari affiliate (nama, email, kode)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="active">Punya Saldo</SelectItem>
                  <SelectItem value="low">Saldo Rendah (&lt;50)</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={exportToCSV} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Credits List */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Kredit Affiliate</CardTitle>
            <CardDescription>
              {filteredCredits.length} dari {credits.length} affiliate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredCredits.length === 0 ? (
                <div className="text-center py-12">
                  <Coins className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Tidak ada data kredit</p>
                </div>
              ) : (
                filteredCredits.map((credit) => (
                  <div
                    key={credit.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {credit.affiliate.user.name}
                        </h3>
                        <Badge variant="outline">
                          {credit.affiliate.affiliateCode}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {credit.affiliate.user.email}
                      </p>
                      <div className="flex items-center gap-6 text-sm">
                        <span className="flex items-center gap-1">
                          <Coins className="w-4 h-4 text-blue-600" />
                          <strong className="text-blue-600">{credit.balance}</strong> saldo
                        </span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <TrendingUp className="w-4 h-4" />
                          {credit.totalTopUp} top up
                        </span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <TrendingDown className="w-4 h-4" />
                          {credit.totalUsed} terpakai
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleManageCredit(credit)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Kelola
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Manage Credit Modal */}
        <Dialog open={manageCreditModal} onOpenChange={setManageCreditModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Kelola Kredit Affiliate</DialogTitle>
              <DialogDescription>
                {selectedAffiliate && (
                  <>
                    <strong>{selectedAffiliate.affiliate.user.name}</strong>
                    <br />
                    Saldo saat ini: <strong className="text-blue-600">{selectedAffiliate.balance}</strong> kredit
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Aksi</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Button
                    variant={creditAction === 'TOPUP' ? 'default' : 'outline'}
                    onClick={() => setCreditAction('TOPUP')}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Top Up
                  </Button>
                  <Button
                    variant={creditAction === 'DEDUCT' ? 'default' : 'outline'}
                    onClick={() => setCreditAction('DEDUCT')}
                    className="w-full"
                  >
                    <Minus className="w-4 h-4 mr-1" />
                    Kurangi
                  </Button>
                  <Button
                    variant={creditAction === 'REFUND' ? 'default' : 'outline'}
                    onClick={() => setCreditAction('REFUND')}
                    className="w-full"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Refund
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="amount">Jumlah Kredit</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Masukkan jumlah..."
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  min="1"
                />
              </div>

              <div>
                <Label htmlFor="description">Keterangan (opsional)</Label>
                <Textarea
                  id="description"
                  placeholder="Alasan perubahan kredit..."
                  value={creditDescription}
                  onChange={(e) => setCreditDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setManageCreditModal(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button onClick={handleSubmitCredit} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Coins className="w-4 h-4 mr-2" />
                    {creditAction === 'TOPUP' ? 'Tambah' : creditAction === 'DEDUCT' ? 'Kurangi' : 'Refund'} Kredit
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ResponsivePageWrapper>
  )
}
