'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import { getRoleTheme } from '@/lib/role-themes'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Users,
  Search,
  Eye,
  ArrowUpDown,
  DollarSign,
  Calendar,
} from 'lucide-react'

interface WalletData {
  userId: string
  user: {
    name: string
    email: string
    role: string
  }
  balance: number
  totalEarnings: number
  totalPayouts: number
  transactionCount: number
  lastTransaction: string | null
}

interface TransactionDetail {
  id: string
  type: string
  amount: number
  description: string
  metadata: any
  createdAt: string
}

export default function AdminWalletsPage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [wallets, setWallets] = useState<WalletData[]>([])
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'balance' | 'earnings' | 'transactions'>('balance')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<WalletData | null>(null)
  const [userTransactions, setUserTransactions] = useState<TransactionDetail[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)

  const theme = getRoleTheme(session?.user?.role || 'ADMIN')

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login')
    }

    if (status === 'authenticated') {
      fetchWallets()
    }
  }, [status])

  const fetchWallets = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/wallets')
      const data = await response.json()
      
      if (data.wallets) {
        setWallets(data.wallets)
      }
    } catch (error) {
      console.error('Error fetching wallets:', error)
    }
    setLoading(false)
  }

  const fetchUserTransactions = async (userId: string, userData: WalletData) => {
    setSelectedUser(userData)
    setLoadingTransactions(true)
    try {
      const response = await fetch(`/api/admin/wallets/${userId}/transactions`)
      const data = await response.json()
      
      if (data.transactions) {
        setUserTransactions(data.transactions)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
    setLoadingTransactions(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Belum ada transaksi'
    
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-purple-100 text-purple-700',
      MENTOR: 'bg-blue-100 text-blue-700',
      AFFILIATE: 'bg-amber-100 text-amber-700',
      MEMBER_PREMIUM: 'bg-green-100 text-green-700',
      MEMBER_FREE: 'bg-gray-100 text-gray-700',
      SUPPLIER: 'bg-pink-100 text-pink-700',
    }
    
    return (
      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${colors[role] || 'bg-gray-100 text-gray-700'}`}>
        {role.replace('_', ' ')}
      </span>
    )
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'CREDIT':
      case 'EARNING':
      case 'COMMISSION':
        return 'text-green-600'
      case 'DEBIT':
      case 'PAYOUT':
      case 'WITHDRAWAL':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  // Calculate summary stats
  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0)
  const totalEarnings = wallets.reduce((sum, w) => sum + w.totalEarnings, 0)
  const totalPayouts = wallets.reduce((sum, w) => sum + w.totalPayouts, 0)
  const activeWallets = wallets.filter(w => w.balance > 0).length

  // Filter and sort wallets
  const filteredWallets = wallets
    .filter(w => {
      if (!search) return true
      
      const searchLower = search.toLowerCase()
      return (
        w.user.name.toLowerCase().includes(searchLower) ||
        w.user.email.toLowerCase().includes(searchLower) ||
        w.user.role.toLowerCase().includes(searchLower)
      )
    })
    .sort((a, b) => {
      let aVal = 0, bVal = 0
      
      if (sortBy === 'balance') {
        aVal = a.balance
        bVal = b.balance
      } else if (sortBy === 'earnings') {
        aVal = a.totalEarnings
        bVal = b.totalEarnings
      } else {
        aVal = a.transactionCount
        bVal = b.transactionCount
      }
      
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal
    })

  if (loading) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Saldo User</h1>
        <p className="text-gray-600">Kelola wallet dan transaksi semua user</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: theme.primary }}
            >
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Saldo</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalBalance)}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center text-white">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalEarnings)}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center text-white">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Payouts</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalPayouts)}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Wallet Aktif</p>
          <p className="text-2xl font-bold text-gray-900">
            {activeWallets} / {wallets.length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Cari User
            </label>
            <input
              type="text"
              placeholder="Nama, email, atau role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Sort By */}
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ArrowUpDown className="w-4 h-4 inline mr-1" />
              Urutkan
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="balance">Saldo</option>
              <option value="earnings">Earnings</option>
              <option value="transactions">Transaksi</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="desc">Tertinggi</option>
              <option value="asc">Terendah</option>
            </select>
          </div>
        </div>
      </div>

      {/* Wallets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredWallets.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
            <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Tidak ada wallet ditemukan</p>
          </div>
        ) : (
          filteredWallets.map((wallet) => (
            <div key={wallet.userId} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              {/* User Info */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{wallet.user.name}</h3>
                    {getRoleBadge(wallet.user.role)}
                  </div>
                  <p className="text-sm text-gray-600">{wallet.user.email}</p>
                </div>
                
                <button
                  onClick={() => fetchUserTransactions(wallet.userId, wallet)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm rounded-xl hover:bg-blue-600 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Detail
                </button>
              </div>

              {/* Balance Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Saldo</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(wallet.balance)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Earnings</p>
                  <p className="text-sm font-semibold text-green-600">
                    {formatCurrency(wallet.totalEarnings)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Payouts</p>
                  <p className="text-sm font-semibold text-red-600">
                    {formatCurrency(wallet.totalPayouts)}
                  </p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
                <span>{wallet.transactionCount} transaksi</span>
                <span className="text-xs">{formatDate(wallet.lastTransaction)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Transaction Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    Transaksi Wallet
                  </h2>
                  <p className="text-sm text-gray-600">
                    {selectedUser.user.name} - {selectedUser.user.email}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* User Balance Summary */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-600 mb-1">Saldo Saat Ini</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(selectedUser.balance)}
                  </p>
                </div>
                <div className="bg-green-50 rounded-xl p-3">
                  <p className="text-xs text-gray-600 mb-1">Total Earnings</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(selectedUser.totalEarnings)}
                  </p>
                </div>
                <div className="bg-red-50 rounded-xl p-3">
                  <p className="text-xs text-gray-600 mb-1">Total Payouts</p>
                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(selectedUser.totalPayouts)}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingTransactions ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : userTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Belum ada transaksi</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userTransactions.map((tx) => (
                    <div key={tx.id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className={`text-lg font-bold ${getTransactionTypeColor(tx.type)}`}>
                              {tx.type === 'CREDIT' || tx.type === 'EARNING' || tx.type === 'COMMISSION' ? '+' : '-'}
                              {formatCurrency(Math.abs(tx.amount))}
                            </p>
                            <span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-200 text-gray-700">
                              {tx.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{tx.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(tx.createdAt)}
                          </p>
                        </div>
                      </div>
                      {tx.metadata && Object.keys(tx.metadata).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500 font-mono">
                            {JSON.stringify(tx.metadata)}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}n                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </ResponsivePageWrapper>
  )
}
