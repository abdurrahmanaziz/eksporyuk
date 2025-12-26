'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  DollarSign, 
  UserCheck, 
  ShoppingCart,
  TrendingUp,
  ArrowUpRight,
  Calendar,
  Clock,
  RefreshCw
} from 'lucide-react'

interface AdminDashboardProps {
  stats: any
  theme: any
  session: any
}

// Format currency
function formatCurrency(amount: number): string {
  if (amount >= 1000000000) {
    return `Rp ${(amount / 1000000000).toFixed(1)}B`
  }
  if (amount >= 1000000) {
    return `Rp ${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `Rp ${(amount / 1000).toFixed(0)}K`
  }
  return `Rp ${amount.toLocaleString('id-ID')}`
}

// Format full currency for lifetime stats
function formatFullCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

export default function AdminDashboard({ stats, theme, session }: AdminDashboardProps) {
  const totalUsers = stats?.totalUsers || 0
  const totalRevenue = stats?.totalRevenue || 0
  const activeMembers = stats?.activeMembers || 0
  const totalTransactions = stats?.totalTransactions || 0
  const pendingApprovals = stats?.pendingApprovals || 0
  const newUsersThisMonth = stats?.newUsersThisMonth || 0
  const revenueThisMonth = stats?.revenueThisMonth || 0
  const totalMemberships = stats?.totalMemberships || 0
  
  // Calculate percentage changes (mock for now)
  const userGrowth = newUsersThisMonth > 0 ? ((newUsersThisMonth / Math.max(totalUsers - newUsersThisMonth, 1)) * 100).toFixed(1) : '0'
  const revenueGrowth = '12.5' // TODO: Calculate actual growth

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
            style={{ 
              backgroundColor: theme.primary,
              boxShadow: `0 4px 14px 0 ${theme.primary}40`
            }}
          >
            <span className="text-white text-xl">{theme.icon}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('id-ID', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            1 Online
          </span>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <RefreshCw className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="p-3 bg-white/20 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
                <ArrowUpRight className="w-3 h-3" />
                {userGrowth}%
              </span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold">{totalUsers.toLocaleString('id-ID')}</p>
              <p className="text-blue-100 text-sm mt-1">Total Users</p>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-blue-100">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                {totalUsers.toLocaleString('id-ID')} Active
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                {newUsersThisMonth} New
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="p-3 bg-white/20 rounded-xl">
                <DollarSign className="w-6 h-6" />
              </div>
              <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
                <ArrowUpRight className="w-3 h-3" />
                {revenueGrowth}%
              </span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold">{formatFullCurrency(totalRevenue)}</p>
              <p className="text-emerald-100 text-sm mt-1">Total Revenue</p>
            </div>
            <div className="mt-3 text-xs text-emerald-100">
              {formatCurrency(revenueThisMonth)} this month
            </div>
          </CardContent>
        </Card>

        {/* Active Members */}
        <Card className="bg-gradient-to-br from-violet-500 to-violet-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="p-3 bg-white/20 rounded-xl">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold">{activeMembers.toLocaleString('id-ID')}</p>
              <p className="text-violet-100 text-sm mt-1">Active Members</p>
            </div>
            <div className="mt-3 text-xs text-violet-100">
              {totalMemberships.toLocaleString('id-ID')} total memberships
            </div>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="p-3 bg-white/20 rounded-xl">
                <ShoppingCart className="w-6 h-6" />
              </div>
              {pendingApprovals > 0 && (
                <span className="flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full">
                  {pendingApprovals}
                </span>
              )}
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold">{totalTransactions.toLocaleString('id-ID')}</p>
              <p className="text-orange-100 text-sm mt-1">Transactions</p>
            </div>
            <div className="mt-3 text-xs text-orange-100">
              {pendingApprovals} pending approval
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row - Charts & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Bulanan */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Revenue Bulanan</CardTitle>
                  <p className="text-sm text-gray-500">Pendapatan 6 bulan terakhir</p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                <ArrowUpRight className="w-4 h-4" />
                +{revenueGrowth}%
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {/* Simple bar chart visualization */}
            <div className="flex items-end justify-between h-32 gap-2 mb-4">
              {[2.1, 1.5, 2.5, 1.7, 2.8, 3.2].map((value, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-blue-100 rounded-t-lg transition-all hover:bg-blue-200"
                    style={{ height: `${(value / 3.5) * 100}%` }}
                  >
                    <div 
                      className="w-full h-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg opacity-80"
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Des'][i]}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="text-sm text-gray-500">Total Bulan Ini</p>
                <p className="text-2xl font-bold text-gray-900">{formatFullCurrency(totalRevenue)}</p>
              </div>
              <a 
                href="/admin/revenue" 
                className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Lihat Detail
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Lifetime Statistics */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Lifetime Statistics</CardTitle>
                <p className="text-sm text-gray-500">Data keseluruhan platform</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-blue-600 mb-2">
                  <Users className="w-4 h-4" />
                  Total Members
                </div>
                <p className="text-2xl font-bold text-gray-900">{totalUsers.toLocaleString('id-ID')}</p>
                <p className="text-xs text-gray-500 mt-1">Sejak awal</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-green-600 mb-2">
                  <DollarSign className="w-4 h-4" />
                  Total Revenue
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatFullCurrency(totalRevenue)}</p>
                <p className="text-xs text-gray-500 mt-1">Lifetime</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-orange-600 mb-2">
                  <ShoppingCart className="w-4 h-4" />
                  Transactions
                </div>
                <p className="text-2xl font-bold text-gray-900">{totalTransactions.toLocaleString('id-ID')}</p>
                <p className="text-xs text-gray-500 mt-1">Total transaksi</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-purple-600 mb-2">
                  <UserCheck className="w-4 h-4" />
                  Active Members
                </div>
                <p className="text-2xl font-bold text-gray-900">{activeMembers.toLocaleString('id-ID')}</p>
                <p className="text-xs text-gray-500 mt-1">Membership aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
