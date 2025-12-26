'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { getRoleTheme } from '@/lib/role-themes'
import EmailVerificationBanner from '@/components/EmailVerificationBanner'
import ProfileCompletionCard from '@/components/profile/ProfileCompletionCard'
import DashboardBanner from '@/components/banners/DashboardBanner'
import MemberOnboardingChecklist from '@/components/member/MemberOnboardingChecklist'
import UpgradeBanner from '@/components/member/UpgradeBanner'
import ProfileCompletionModal from '@/components/member/ProfileCompletionModal'
import UpgradeModal from '@/components/member/UpgradeModal'
import EmailVerificationModal from '@/components/member/EmailVerificationModal'
import TrialReminderBanner from '@/components/member/TrialReminderBanner'
import FreeUserDashboard from '@/components/member/FreeUserDashboard'
import MembershipExpiryBanner from '@/components/member/MembershipExpiryBanner'
import PremiumMemberDashboard from '@/components/dashboard/PremiumMemberDashboard'
import AdminDashboard from '@/components/dashboard/AdminDashboard'
import { DashboardStatsSkeleton } from '@/components/ui/loading-skeletons'
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
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Award,
  Briefcase,
  Calendar,
  Clock,
  Star,
} from 'lucide-react'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [profileCompleted, setProfileCompleted] = useState(false)

  // Use React Query for cached stats
  const { data: stats, isLoading: loading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      return response.json()
    },
    enabled: status === 'authenticated',
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60000, // Refresh every minute
  })

  const theme = session?.user?.role ? getRoleTheme(session.user.role) : getRoleTheme('MEMBER_FREE')
  
  // Check if user is free member - show special dashboard
  const isFreeUser = session?.user?.role === 'MEMBER_FREE'
  
  // Check if user is premium member - show new premium dashboard
  const isPremiumUser = session?.user?.role === 'MEMBER_PREMIUM'

  // Check if user is admin (skip verification)
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN'

  useEffect(() => {
    if (status === 'authenticated') {
      // Set initial email verified state from session
      setEmailVerified(session?.user?.emailVerified || isAdmin)
    }
  }, [status, session, isAdmin])

  // Callback when email is verified
  const handleEmailVerified = () => {
    setEmailVerified(true)
  }

  // Callback when profile is completed - show upgrade modal
  const handleProfileComplete = () => {
    setProfileCompleted(true)
    // Small delay to show the upgrade modal after profile modal closes
    setTimeout(() => {
      setShowUpgradeModal(true)
    }, 500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 mx-auto mb-4" 
               style={{ borderTopColor: theme.primary }}></div>
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  // Free User Dashboard - Special layout focused on upgrade
  if (isFreeUser) {
    return (
      <>
        {/* Step 1: Email Verification Modal - Shows first if email not verified */}
        <EmailVerificationModal onComplete={handleEmailVerified} />
        
        {/* Step 2: Profile Completion Modal - Shows after email verified */}
        {emailVerified && <ProfileCompletionModal onComplete={handleProfileComplete} />}
        
        {/* Free User Dashboard with upgrade focus */}
        <FreeUserDashboard />
      </>
    )
  }

  // Premium Member Dashboard - New modern design
  if (isPremiumUser) {
    return (
      <>
        {/* Membership Expiry Banner - Shows countdown when membership expiring */}
        <MembershipExpiryBanner />
        
        {/* Email Verification Modal */}
        {!isAdmin && <EmailVerificationModal onComplete={handleEmailVerified} />}
        
        {/* Profile Completion Modal - Shows if profile incomplete */}
        {emailVerified && <ProfileCompletionModal onComplete={handleProfileComplete} />}
        
        {/* Premium Member Dashboard */}
        <PremiumMemberDashboard />
      </>
    )
  }

  // Admin/Founder/Co-Founder Dashboard - Skip all member banners/modals
  if (isAdmin || session?.user?.role === 'FOUNDER' || session?.user?.role === 'CO_FOUNDER') {
    return (
      <ResponsivePageWrapper>
        <AdminDashboard stats={stats} theme={theme} session={session} />
      </ResponsivePageWrapper>
    )
  }

  return (
    <>
    {/* Membership Expiry Banner - Shows countdown for premium users when membership expiring */}
    {isPremiumUser && <MembershipExpiryBanner />}
    
    {/* Trial Reminder Banner - Fixed at top for FREE users */}
    <TrialReminderBanner />
    
    <ResponsivePageWrapper>
    {/* Step 1: Email Verification Modal - Shows first if email not verified (except admin) */}
    {!isAdmin && <EmailVerificationModal onComplete={handleEmailVerified} />}
    
    {/* Step 2: Profile Completion Modal - Shows after email verified, if profile incomplete */}
    {emailVerified && <ProfileCompletionModal onComplete={handleProfileComplete} />}
    
    {/* Step 3: Upgrade Modal - Shows after profile is complete */}
    <UpgradeModal 
      showAfterProfileComplete={true}
      forceOpen={showUpgradeModal}
      onDismiss={() => setShowUpgradeModal(false)}
    />
    
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Email Verification Banner */}
      <EmailVerificationBanner />
      
      {/* Member Onboarding Checklist - Shows if profile incomplete */}
      <MemberOnboardingChecklist variant="full" />
      
      {/* Upgrade Banner - Shows if no membership */}
      <UpgradeBanner variant="full" showDismiss />
      
      {/* Profile Completion Card */}
      <ProfileCompletionCard />
      
      {/* Dashboard Banner - Promotional Carousel */}
      <DashboardBanner placement="DASHBOARD" />
      
      {/* Welcome Banner - Dibales.ai Style */}
      <div className="relative overflow-hidden rounded-2xl shadow-sm border border-gray-100">
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`
          }}
        />
        <div className="relative bg-white/80 backdrop-blur-sm p-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg"
                  style={{ 
                    backgroundColor: theme.primary,
                    boxShadow: `0 4px 14px 0 ${theme.primary}40`
                  }}
                >
                  <span className="text-white">{theme.icon}</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {theme.displayName}
                  </h1>
                  <p className="text-sm text-gray-600">{theme.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Selamat datang kembali,</p>
              <p className="text-lg font-semibold" style={{ color: theme.primary }}>
                {session?.user?.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats - Dibales.ai Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Eye}
          label="Total Akses"
          value="1,234"
          change="+12%"
          trend="up"
          color={theme.primary}
        />
        <StatCard
          icon={Heart}
          label="Interaksi"
          value="567"
          change="+8%"
          trend="up"
          color={theme.secondary}
        />
        <StatCard
          icon={MessageSquare}
          label="Konten"
          value="89"
          change="+5%"
          trend="up"
          color={theme.accent}
        />
        <StatCard
          icon={Star}
          label="Rating"
          value="4.8"
          change="Excellent"
          trend="up"
          color={theme.primary}
        />
      </div>

      {/* Role-Specific Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business Overview */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Ringkasan Bisnis</h2>
              <button className="text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                      style={{ color: theme.primary }}>
                Lihat Semua →
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                icon={DollarSign}
                label="Total Revenue"
                value="Rp 125.5M"
                subtitle="+12% dari bulan lalu"
                color={theme.primary}
              />
              <MetricCard
                icon={Users}
                label="Active Members"
                value="2,345"
                subtitle="+43 member baru"
                color={theme.secondary}
              />
              <MetricCard
                icon={Target}
                label="Conversion Rate"
                value="3.2%"
                subtitle="+0.5% improvement"
                color={theme.accent}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Aksi Cepat</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <ActionButton
                icon={Users}
                label="Buat Automation Instagram"
                subtitle="Setup Comment,Story,Mention to DM"
                color={theme.primary}
              />
              <ActionButton
                icon={MessageSquare}
                label="Buat Automation WhatsApp"
                subtitle="Setup Follow-Up Campaign & Keyword Reply"
                color={theme.secondary}
              />
              <ActionButton
                icon={Award}
                label="Halaman Affiliate"
                subtitle="Ajak teman, dapat cuan tiap bulan!"
                color={theme.accent}
              />
              <ActionButton
                icon={Activity}
                label="Panduan Platform"
                subtitle="Pelajari cara pakai platform dibales.ai"
                color={theme.primary}
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Plan */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Paket Saat Ini</h3>
              <div 
                className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: theme.primary }}
              >
                Plus
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">Kadaluwarsa pada 17 Desember 2025</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Otomasi Instagram</span>
                <span className="font-semibold text-gray-900">25</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">DM Terkirim</span>
                <span className="font-semibold text-gray-900">287</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Kampanye WhatsApp</span>
                <span className="font-semibold text-gray-900">0</span>
              </div>
            </div>
            <button 
              className="w-full mt-4 py-2.5 rounded-lg font-medium text-white shadow-sm hover:shadow-md transition-all"
              style={{ backgroundColor: theme.primary }}
            >
              Upgrade Paket
            </button>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Aktivitas Terkini</h3>
            <div className="space-y-4">
              <ActivityItem
                icon={MessageSquare}
                label="Pesan terkirim"
                value="278 kontak"
                color={theme.primary}
              />
              <ActivityItem
                icon={Users}
                label="Followers baru"
                value="+45 hari ini"
                color={theme.secondary}
              />
              <ActivityItem
                icon={TrendingUp}
                label="Engagement rate"
                value="8.5%"
                color={theme.accent}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    </ResponsivePageWrapper>
    </>
  )
}

// Stat Card Component - Dibales.ai Style
function StatCard({ icon: Icon, label, value, change, trend, color }: any) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: color + '10' }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        {trend === 'up' && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50">
            <ArrowUpRight className="w-4 h-4 text-green-600" />
            <span className="text-xs font-semibold text-green-600">{change}</span>
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  )
}

// Metric Card Component
function MetricCard({ icon: Icon, label, value, subtitle, color }: any) {
  return (
    <div className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: color + '10' }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  )
}

// Action Button Component
function ActionButton({ icon: Icon, label, subtitle, color }: any) {
  return (
    <button className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 bg-white hover:bg-gray-50 transition-all text-left group">
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
        style={{ backgroundColor: color + '10' }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <h4 className="text-sm font-semibold text-gray-900 mb-1">{label}</h4>
      <p className="text-xs text-gray-500 line-clamp-2">{subtitle}</p>
    </button>
  )
}

// Activity Item Component
function ActivityItem({ icon: Icon, label, value, color }: any) {
  return (
    <div className="flex items-center gap-3">
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: color + '10' }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{value}</p>
      </div>
    </div>
  )
}
