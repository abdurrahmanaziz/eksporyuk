'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { User, DollarSign, GraduationCap, Shield, BarChart3, HelpCircle, UserCircle, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'

interface DashboardOption {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  href: string
  color: string
  bgColor: string
}

interface ApiDashboardOption {
  id: string
  title: string
  description: string
  href: string
  icon: string
  color: string
  bgColor: string
}

// Map icon string to component
const iconMap: Record<string, React.ComponentType<any>> = {
  User,
  DollarSign,
  GraduationCap,
  Shield,
  BarChart3
}

export default function DashboardSelector() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [dashboardOptions, setDashboardOptions] = useState<DashboardOption[]>([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [allRoles, setAllRoles] = useState<string[]>([])
  
  const userRole = session?.user?.role || ''
  
  // Fetch dashboard options from API based on ALL user roles in database
  useEffect(() => {
    const fetchDashboardOptions = async () => {
      if (!session?.user?.id) return
      
      try {
        const response = await fetch('/api/user/dashboard-options')
        const data = await response.json()
        
        if (data.success && data.dashboardOptions) {
          // Convert API options to component format with icon components
          const options: DashboardOption[] = data.dashboardOptions.map((opt: ApiDashboardOption) => ({
            ...opt,
            icon: iconMap[opt.icon] || User
          }))
          
          setDashboardOptions(options)
          setAllRoles(data.allRoles || [])
          
          // If user has preferred dashboard and it's available, redirect
          if (data.preferredDashboard) {
            const preferred = options.find((o: DashboardOption) => o.id === data.preferredDashboard)
            if (preferred) {
              router.push(preferred.href)
              return
            }
          }
          
          // Auto-redirect if only one option
          if (options.length === 1) {
            setTimeout(() => {
              router.push(options[0].href)
            }, 500)
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard options:', error)
        // Fallback to primary role only
        setDashboardOptions(getFallbackOptions(userRole))
      } finally {
        setIsLoadingOptions(false)
      }
    }
    
    if (session?.user?.id) {
      fetchDashboardOptions()
    }
  }, [session?.user?.id, userRole, router])
  
  // Fallback function in case API fails
  const getFallbackOptions = (role: string): DashboardOption[] => {
    const options: DashboardOption[] = []
    
    if (['MEMBER_FREE', 'MEMBER_PREMIUM', 'AFFILIATE', 'MENTOR'].includes(role)) {
      options.push({
        id: 'member',
        title: 'Member Dashboard',
        description: 'Akses kursus, materi, dan fitur membership Anda',
        icon: User,
        href: '/dashboard?selected=member',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 border-blue-200'
      })
    }
    
    if (role === 'AFFILIATE') {
      options.push({
        id: 'affiliate',
        title: 'Rich Affiliate',
        description: 'Kelola affiliate earnings, track referral links, dan lihat komisi Anda',
        icon: DollarSign,
        href: '/affiliate/dashboard',
        color: 'text-green-600',
        bgColor: 'bg-green-50 border-green-200'
      })
    }
    
    if (role === 'MENTOR') {
      options.push({
        id: 'mentor',
        title: 'Mentor Hub',
        description: 'Buat kursus, kelola siswa, dan pantau progress pembelajaran',
        icon: GraduationCap,
        href: '/mentor/dashboard',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50 border-purple-200'
      })
    }
    
    return options
  }
  
  // Admin redirect - they shouldn't be here, send to /admin
  useEffect(() => {
    if (userRole === 'ADMIN') {
      router.push('/admin')
    }
  }, [userRole, router])
  
  // Redirect to login if no session - after all hooks
  useEffect(() => {
    if (status !== 'loading' && !session?.user) {
      router.push('/login')
    }
  }, [status, session, router])
  
  // Loading state - session loading or options loading
  if (status === 'loading' || isLoadingOptions) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-sm">Memuat dashboard options...</p>
      </div>
    </div>
  }

  // No session - show loading while redirecting
  if (!session?.user) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  }
  
  // Admin should not see this page - show loading while redirecting
  if (userRole === 'ADMIN') {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Mengarahkan ke Admin Panel...</p>
      </div>
    </div>
  }

  const handleDashboardSelect = async (option: DashboardOption) => {
    setLoading(option.id)
    
    try {
      // Save preference to database via API
      const response = await fetch('/api/user/set-preferred-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dashboardType: option.id })
      })
      
      if (!response.ok) {
        console.error('Failed to save dashboard preference')
      }
    } catch (error) {
      console.error('Error saving preference:', error)
    }
    
    // Navigate to selected dashboard
    router.push(option.href)
  }

  // Single option - show loading and redirect
  if (dashboardOptions.length === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Mengarahkan ke Dashboard...
          </h2>
          <p className="text-gray-600">
            Mengakses {dashboardOptions[0].title}
          </p>
        </div>
      </div>
    )
  }

  // Get user display name
  const displayName = session.user.name?.split(' ')[0] || 'User'
  const fullName = session.user.name || session.user.email || 'User'
  
  // Get role badge text based on all roles
  const getRoleBadges = () => {
    const badges: string[] = []
    
    if (allRoles.includes('MEMBER_PREMIUM')) badges.push('Premium')
    else if (allRoles.includes('MEMBER_FREE')) badges.push('Member')
    
    if (allRoles.includes('AFFILIATE')) badges.push('Affiliate')
    if (allRoles.includes('MENTOR')) badges.push('Mentor')
    if (allRoles.includes('ADMIN')) badges.push('Admin')
    
    return badges.length > 0 ? badges : ['Member']
  }
  
  const roleBadges = getRoleBadges()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Header - Mobile Responsive */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <img src="/logo.png" alt="Eksporyuk" className="h-7 sm:h-8 w-auto" />
              <span className="text-base sm:text-lg font-semibold text-gray-900 hidden sm:block">Eksporyuk</span>
            </div>
            
            {/* User Info - Mobile Optimized */}
            <div className="text-right">
              <div className="text-xs sm:text-sm font-medium text-gray-900 flex items-center gap-1 sm:gap-2 flex-wrap justify-end">
                <span className="truncate max-w-[100px] sm:max-w-none">{fullName.split(' ')[0]}</span>
                <span className="text-gray-400 hidden sm:inline">•</span>
                <div className="flex gap-1">
                  {roleBadges.map((badge, index) => (
                    <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile First */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-4xl w-full">
          {/* Welcome Section */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
              Welcome Back, {displayName} 👋
            </h1>
            <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto px-4">
              Pilih dashboard untuk mengelola aktivitas Anda
            </p>
          </div>

          {/* Dashboard Options - Mobile Stacked, Desktop Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {dashboardOptions.map((option) => {
              const IconComponent = option.icon
              const isLoading = loading === option.id
              
              return (
                <button
                  key={option.id}
                  onClick={() => handleDashboardSelect(option)}
                  disabled={loading !== null}
                  className={`
                    relative overflow-hidden rounded-xl sm:rounded-2xl border-2 p-4 sm:p-6 text-left
                    active:scale-[0.98] hover:scale-[1.02] hover:shadow-lg transform transition-all duration-200
                    focus:outline-none focus:ring-4 focus:ring-blue-500/20
                    disabled:opacity-70 disabled:cursor-not-allowed
                    ${option.bgColor}
                  `}
                >
                  {/* Loading overlay */}
                  {isLoading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-xl sm:rounded-2xl">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  
                  {/* Card Content */}
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ${option.bgColor} border`}>
                      <IconComponent className={`w-5 h-5 sm:w-6 sm:h-6 ${option.color}`} />
                    </div>
                    
                    {/* Text Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                        {option.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-2">
                        {option.description}
                      </p>
                      
                      {/* CTA Button */}
                      <div className="mt-3 sm:mt-4">
                        <span className={`inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium text-white 
                          ${option.id === 'affiliate' ? 'bg-green-600' :
                            option.id === 'mentor' ? 'bg-purple-600' :
                            'bg-blue-600'}
                          transition-colors`}>
                          {option.id === 'affiliate' ? '💰 Access Dashboard' : 
                           option.id === 'mentor' ? '📚 Go to Dashboard' :
                           '🏠 Go to Dashboard'}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Footer Actions - Mobile Friendly */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-sm">
            <button 
              onClick={() => router.push('/help')}
              className="flex items-center gap-1.5 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Bantuan</span>
            </button>
            <button 
              onClick={() => router.push('/profile')}
              className="flex items-center gap-1.5 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <UserCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Profil</span>
            </button>
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-1.5 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
          
          <div className="text-center mt-6 text-xs text-gray-400">
            © 2025 Eksporyuk. All rights reserved.
          </div>
        </div>
      </main>
    </div>
  )
}