'use client'

import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Package, 
  DollarSign, 
  Activity, 
  Crown, 
  Settings,
  TrendingUp,
  Bell,
  ShoppingCart,
  BookOpen,
  MessageSquare,
  AlertCircle,
  Radio,
  Zap,
  Link2,
  Award,
  Flag,
  FileText,
  Percent,
  CreditCard,
  RefreshCw,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminStats, useXenditBalance } from '@/hooks/use-api'

interface DashboardStats {
  users: {
    total: number
    active: number
    new30Days: number
    growth: string
    online: number
  }
  memberships: {
    total: number
    active: number
  }
  revenue: {
    total: number
    thisMonth: number
    growth: string
  }
  transactions: {
    total: number
    pending: number
  }
  content: {
    courses: number
    lessons: number
    products: number
    forums: number
    discussions: number
    comments: number
  }
  affiliates: {
    totalLinks: number
    activeLinks: number
    totalClicks: number
  }
  notifications: {
    sent30Days: number
    templates: number
    autoRules: number
  }
  moderation: {
    pendingReports: number
  }
}

export default function AdminPage() {
  const { data: session } = useSession()
  
  // Use React Query hooks for cached, auto-refreshing data
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useAdminStats()
  const { data: xenditBalance, isLoading: xenditLoading, error: xenditError, refetch: refetchXendit } = useXenditBalance()

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <ResponsivePageWrapper>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Crown className="w-8 h-8 text-yellow-500" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {session.user.name} • Real-time platform overview
            </p>
          </div>
          <div className="flex items-center gap-2">
            {stats?.users.online !== undefined && (
              <Badge variant="outline" className="gap-1">
                <Radio className="h-3 w-3 text-green-500 animate-pulse" />
                {stats.users.online} online
              </Badge>
            )}
            {stats?.moderation.pendingReports > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                {stats.moderation.pendingReports} reports
              </Badge>
            )}
          </div>
        </div>

        {/* Primary Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Users */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.users.total.toLocaleString()}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span>+{stats?.users.growth}% this month</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {stats?.users.active.toLocaleString()} active • {stats?.users.new30Days} new
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{formatCurrency(stats?.revenue.total || 0)}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span>+{stats?.revenue.growth}% growth</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(stats?.revenue.thisMonth || 0)} this month
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Active Memberships */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Memberships</CardTitle>
              <Crown className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.memberships.active.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Active memberships
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stats?.memberships.total.toLocaleString()} total
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Pending Transactions */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <ShoppingCart className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.transactions.total.toLocaleString()}</div>
                  {stats?.transactions.pending > 0 && (
                    <Badge variant="destructive" className="mt-2">
                      {stats.transactions.pending} pending
                    </Badge>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    All time transactions
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Xendit Balance Card */}
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600 rounded-lg">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-blue-900">Saldo Xendit</CardTitle>
                  <CardDescription>Balance payment gateway untuk transaksi otomatis</CardDescription>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.reload()}
                disabled={xenditLoading}
                className="border-blue-300 text-blue-600 hover:bg-blue-100"
              >
                {xenditLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {xenditLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Mengambil balance...</span>
              </div>
            ) : xenditError ? (
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-amber-800 font-medium">Tidak dapat mengambil balance</p>
                  <p className="text-amber-700 text-sm">{xenditError}</p>
                </div>
              </div>
            ) : xenditBalance ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-lg border border-blue-200 shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Available Balance</p>
                  <p className="text-3xl font-bold text-blue-600">
                    Rp {(xenditBalance.balance || 0).toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Saldo tersedia</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Account Type</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {xenditBalance.accountType || 'CASH'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Tipe akun</p>
                </div>

                <div className="bg-white p-6 rounded-lg border border-green-200 shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <Badge variant="default" className="bg-green-600">
                    Active
                  </Badge>
                  <p className="text-xs text-gray-500 mt-2">Payment gateway aktif</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                Tidak ada data balance
              </div>
            )}
          </CardContent>
        </Card>

        {/* Secondary Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Content Stats */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Content</CardTitle>
              <BookOpen className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Courses:</span>
                      <span className="font-semibold">{stats?.content.courses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lessons:</span>
                      <span className="font-semibold">{stats?.content.lessons}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Products:</span>
                      <span className="font-semibold">{stats?.content.products}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Community Stats */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Community</CardTitle>
              <MessageSquare className="h-4 w-4 text-pink-500" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Forums:</span>
                      <span className="font-semibold">{stats?.content.forums}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discussions:</span>
                      <span className="font-semibold">{stats?.content.discussions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Comments:</span>
                      <span className="font-semibold">{stats?.content.comments}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Affiliate Stats */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Affiliates</CardTitle>
              <Link2 className="h-4 w-4 text-cyan-500" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Links:</span>
                      <span className="font-semibold">{stats?.affiliates.totalLinks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Active:</span>
                      <span className="font-semibold">{stats?.affiliates.activeLinks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Clicks:</span>
                      <span className="font-semibold">{stats?.affiliates.totalClicks}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Notifications Stats */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <Bell className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sent (30d):</span>
                      <span className="font-semibold">{stats?.notifications.sent30Days}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Templates:</span>
                      <span className="font-semibold">{stats?.notifications.templates}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Auto Rules:</span>
                      <span className="font-semibold">{stats?.notifications.autoRules}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              User Management
            </CardTitle>
            <CardDescription>Manage users, roles, and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/admin/users">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Users
                </Button>
              </Link>
              <Link href="/admin/memberships">
                <Button variant="outline" className="w-full justify-start">
                  <Crown className="mr-2 h-4 w-4" />
                  Memberships
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Revenue & Sales
            </CardTitle>
            <CardDescription>View sales reports and transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/admin/revenue">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Revenue Dashboard
                </Button>
              </Link>
              <Link href="/admin/transactions">
                <Button variant="outline" className="w-full justify-start">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Transactions
                </Button>
              </Link>
              <Link href="/admin/invoices">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Invoices
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-500" />
              Content & Community
            </CardTitle>
            <CardDescription>Manage courses, products, and forums</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/admin/courses">
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Courses
                </Button>
              </Link>
              <Link href="/admin/products">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="mr-2 h-4 w-4" />
                  Products
                </Button>
              </Link>
              <Link href="/admin/forums">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Forums
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-cyan-500" />
              Affiliates
            </CardTitle>
            <CardDescription>Manage affiliate links and coupons</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/admin/affiliates">
                <Button variant="outline" className="w-full justify-start">
                  <Link2 className="mr-2 h-4 w-4" />
                  Affiliate Links
                </Button>
              </Link>
              <Link href="/admin/coupons">
                <Button variant="outline" className="w-full justify-start">
                  <Percent className="mr-2 h-4 w-4" />
                  Coupons
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-500" />
              Marketing & Outreach
            </CardTitle>
            <CardDescription>Push notifications and email campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/admin/onesignal">
                <Button variant="outline" className="w-full justify-start">
                  <Bell className="mr-2 h-4 w-4" />
                  OneSignal
                </Button>
              </Link>
              <Link href="/admin/certificates">
                <Button variant="outline" className="w-full justify-start">
                  <Award className="mr-2 h-4 w-4" />
                  Certificates
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-500" />
              System & Settings
            </CardTitle>
            <CardDescription>Platform configuration and reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/admin/settings">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </Link>
              <Link href="/admin/reports">
                <Button variant="outline" className="w-full justify-start">
                  <Flag className="mr-2 h-4 w-4" />
                  Reports
                  {stats?.moderation.pendingReports > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {stats.moderation.pendingReports}
                    </Badge>
                  )}
                </Button>
              </Link>
              <Link href="/admin/integrations">
                <Button variant="outline" className="w-full justify-start">
                  <Zap className="mr-2 h-4 w-4" />
                  Integrations
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </ResponsivePageWrapper>
  )
}
