'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getRoleTheme } from '@/lib/role-themes'
import {
  Users,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Eye,
  Heart,
  MessageSquare,
  BarChart3,
  Target,
  Zap,
} from 'lucide-react'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const theme = session?.user?.role ? getRoleTheme(session.user.role) : getRoleTheme('MEMBER_FREE')

  useEffect(() => {
    if (status === 'authenticated') {
      fetchStats()
    }
  }, [status])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: theme.primary }}></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hero Section - Dibales.ai Style */}
      <div className="relative overflow-hidden rounded-xl p-8 text-white" style={{ backgroundColor: theme.primary }}>
        <div className="absolute top-0 right-0 w-40 h-40 opacity-10" style={{ backgroundColor: theme.secondary }}></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 opacity-10" style={{ backgroundColor: theme.accent }}></div>
        <div className="relative z-10">
          <div className="text-4xl mb-2">{theme.icon}</div>
          <h1 className="text-3xl font-bold mb-2">{theme.displayName}</h1>
          <p className="text-white/80 mb-4">{theme.description}</p>
          <p className="text-white/70 text-sm">Selamat datang kembali, <strong>{session?.user?.name}</strong>!</p>
        </div>
      </div>

      {/* Quick Stats Grid - Dibales.ai Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Eye className="w-8 h-8" />}
          label="Total Akses"
          value="1,234"
          change="+12%"
          color={theme.primary}
        />
        <StatCard
          icon={<Heart className="w-8 h-8" />}
          label="Interaksi"
          value="567"
          change="+8%"
          color={theme.secondary}
        />
        <StatCard
          icon={<MessageSquare className="w-8 h-8" />}
          label="Konten"
          value="89"
          change="+5%"
          color={theme.accent}
        />
        <StatCard
          icon={<Zap className="w-8 h-8" />}
          label="Rating"
          value="4.8 ⭐"
          change="Excellent"
          color={theme.primary}
        />
      </div>

      {/* Role-Specific Sections */}
      {['ADMIN', 'FOUNDER', 'CO_FOUNDER'].includes(session?.user?.role || '') ? (
        <AdminDashboard stats={stats} theme={theme} />
      ) : session?.user?.role === 'MENTOR' ? (
        <MentorDashboard stats={stats} theme={theme} />
      ) : session?.user?.role === 'AFFILIATE' ? (
        <AffiliateDashboard stats={stats} theme={theme} />
      ) : (
        <MemberDashboard stats={stats} theme={theme} />
      )}
    </div>
  )
}

// Stat Card Component
function StatCard({ icon, label, value, change, color }: any) {
  return (
    <div className="bg-white rounded-lg p-6 border-l-4 hover:shadow-md transition-shadow" style={{ borderColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
          <p className="text-xs mt-2" style={{ color }}>{change}</p>
        </div>
        <div style={{ color }}>{icon}</div>
      </div>
    </div>
  )
}

// Admin/Founder/Co-Founder Dashboard
function AdminDashboard({ stats, theme }: any) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Ringkasan Bisnis</h2>
        <a href="/dashboard/financials" className="text-sm font-medium hover:underline" style={{ color: theme.primary }}>
          Lihat Semua →
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="w-4 h-4 mr-2" style={{ color: theme.primary }} />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: theme.primary }}>Rp 125.5M</div>
            <p className="text-xs text-gray-500 mt-2">+12% dari bulan lalu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="w-4 h-4 mr-2" style={{ color: theme.secondary }} />
              Active Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: theme.secondary }}>2,345</div>
            <p className="text-xs text-gray-500 mt-2">+45 member baru</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" style={{ color: theme.accent }} />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: theme.accent }}>3.2%</div>
            <p className="text-xs text-gray-500 mt-2">+0.5% improvement</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Mentor Dashboard
function MentorDashboard({ stats, theme }: any) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Statistik Mengajar</h2>
        <a href="/dashboard/courses" className="text-sm font-medium hover:underline" style={{ color: theme.primary }}>
          Lihat Kursus →
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="w-4 h-4 mr-2" style={{ color: theme.primary }} />
              Siswa Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: theme.primary }}>523</div>
            <p className="text-xs text-gray-500 mt-2">Terdaftar di kelas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="w-4 h-4 mr-2" style={{ color: theme.secondary }} />
              Earning Bulan Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: theme.secondary }}>Rp 12.5M</div>
            <p className="text-xs text-gray-500 mt-2">+25% lebih tinggi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" style={{ color: theme.accent }} />
              Rating Kelas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: theme.accent }}>4.9 ⭐</div>
            <p className="text-xs text-gray-500 mt-2">Dari 523 review</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Affiliate Dashboard
function AffiliateDashboard({ stats, theme }: any) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Statistik Afiliasi</h2>
        <a href="/dashboard/affiliate/stats" className="text-sm font-medium hover:underline" style={{ color: theme.primary }}>
          Lihat Detail →
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Eye className="w-4 h-4 mr-2" style={{ color: theme.primary }} />
              Total Klik
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: theme.primary }}>15,234</div>
            <p className="text-xs text-gray-500 mt-2">+32% minggu ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="w-4 h-4 mr-2" style={{ color: theme.secondary }} />
              Konversi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: theme.secondary }}>487</div>
            <p className="text-xs text-gray-500 mt-2">3.2% conversion rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="w-4 h-4 mr-2" style={{ color: theme.accent }} />
              Earning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: theme.accent }}>Rp 2.3M</div>
            <p className="text-xs text-gray-500 mt-2">Siap cashout</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Member Dashboard
function MemberDashboard({ stats, theme }: any) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Aktivitas Anda</h2>
        <a href="/dashboard/feed" className="text-sm font-medium hover:underline" style={{ color: theme.primary }}>
          Lihat Feed →
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <ShoppingBag className="w-4 h-4 mr-2" style={{ color: theme.primary }} />
              Kelas Diikuti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: theme.primary }}>12</div>
            <p className="text-xs text-gray-500 mt-2">3 dalam progres</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" style={{ color: theme.secondary }} />
              Postingan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: theme.secondary }}>45</div>
            <p className="text-xs text-gray-500 mt-2">8 liked hari ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="w-4 h-4 mr-2" style={{ color: theme.accent }} />
              Group Bergabung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: theme.accent }}>23</div>
            <p className="text-xs text-gray-500 mt-2">5 aktif kemarin</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
