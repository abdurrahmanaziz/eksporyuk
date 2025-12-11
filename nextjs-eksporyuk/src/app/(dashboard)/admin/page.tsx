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
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminStats, useXenditBalance } from '@/hooks/use-api'
import { cn } from '@/lib/utils'

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
      <div className="container mx-auto p-6 space-y-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
        {/* Modern Header with Gradient */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Dashboard
              </h1>
            </div>
            <p className="text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {stats?.users.online !== undefined && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700 dark:text-green-300">{stats.users.online} Online</span>
              </div>
            )}
            {stats?.moderation.pendingReports > 0 && (
              <Badge variant="destructive" className="gap-1 px-3 py-2 rounded-xl">
                <AlertCircle className="h-4 w-4" />
                {stats.moderation.pendingReports} Reports
              </Badge>
            )}
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => { refetchStats(); refetchXendit(); }}
              className="rounded-xl"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Modern Stats Cards with Gradient */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Users Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
            <CardContent className="pt-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                {!statsLoading && stats?.users.growth && (
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
                    parseFloat(stats.users.growth) >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {parseFloat(stats.users.growth) >= 0 ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {stats.users.growth}%
                  </div>
                )}
              </div>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    {stats?.users.total.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Total Users</p>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-muted-foreground">{stats?.users.active.toLocaleString()} Active</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-muted-foreground">{stats?.users.new30Days} New</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Total Revenue Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
            <CardContent className="pt-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                {!statsLoading && stats?.revenue.growth && (
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
                    parseFloat(stats.revenue.growth) >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {parseFloat(stats.revenue.growth) >= 0 ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {stats.revenue.growth}%
                  </div>
                )}
              </div>
              {statsLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    {formatCurrency(stats?.revenue.total || 0)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Total Revenue</p>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(stats?.revenue.thisMonth || 0)} this month
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Memberships Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-purple-600/20 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
            <CardContent className="pt-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                  <Crown className="h-6 w-6 text-white" />
                </div>
              </div>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    {stats?.memberships.active.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Active Members</p>
                  <div className="text-xs text-muted-foreground">
                    {stats?.memberships.total.toLocaleString()} total memberships
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Transactions Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/20 to-orange-600/20 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
            <CardContent className="pt-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                {!statsLoading && stats?.transactions.pending > 0 && (
                  <Badge variant="destructive" className="rounded-lg">
                    {stats.transactions.pending}
                  </Badge>
                )}
              </div>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    {stats?.transactions.total.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Transactions</p>
                  <div className="text-xs text-muted-foreground">
                    {stats?.transactions.pending > 0 ? `${stats.transactions.pending} pending approval` : 'All processed'}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Xendit Balance Card - Modern Design */}
        <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-1">Xendit Balance</h3>
                  <p className="text-blue-100 text-sm">Payment gateway balance</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {xenditLoading ? (
                  <Skeleton className="h-12 w-48 bg-white/20" />
                ) : xenditError ? (
                  <div className="text-sm bg-red-500/20 px-4 py-2 rounded-lg">
                    {xenditError instanceof Error ? xenditError.message : String(xenditError)}
                  </div>
                ) : (
                  <div className="text-right">
                    <div className="text-4xl font-bold">{formatCurrency(xenditBalance?.balance || 0)}</div>
                    <div className="text-sm text-blue-100 mt-1">Available balance</div>
                  </div>
                )}
                <Button 
```
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
                  <p className="text-amber-700 text-sm">{xenditError instanceof Error ? xenditError.message : String(xenditError)}</p>
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
              <Link href="/admin/membership">
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
              <Link href="/admin/sales">
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
              <Link href="/admin/transactions">
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
              <Link href="/admin/groups">
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
