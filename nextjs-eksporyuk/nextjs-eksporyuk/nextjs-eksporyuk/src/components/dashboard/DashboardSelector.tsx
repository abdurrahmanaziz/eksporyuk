'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  User, DollarSign, GraduationCap, Shield, BarChart3, 
  ArrowRight, Sparkles, LogOut
} from 'lucide-react'
import { signOut } from 'next-auth/react'

interface DashboardOption {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  href: string
  color: string
  bgColor: string
  gradient: string
  iconBg: string
  features: string[]
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

// Dashboard configurations with rich styling
const dashboardConfigs: Record<string, Partial<DashboardOption>> = {
  member: {
    gradient: 'from-blue-600 via-blue-500 to-cyan-500',
    iconBg: 'bg-white/20',
    features: ['Akses Kursus Premium', 'Materi Eksklusif', 'Sertifikat'],
  },
  affiliate: {
    gradient: 'from-emerald-600 via-emerald-500 to-teal-500',
    iconBg: 'bg-white/20',
    features: ['Komisi Tinggi', 'Tracking Real-time', 'Withdraw Cepat'],
  },
  mentor: {
    gradient: 'from-purple-600 via-purple-500 to-indigo-500',
    iconBg: 'bg-white/20',
    features: ['Buat Kursus', 'Kelola Siswa', 'Analytics'],
  },
  admin: {
    gradient: 'from-red-600 via-red-500 to-orange-500',
    iconBg: 'bg-white/20',
    features: ['Full Access', 'User Management', 'System Settings'],
  },
}

export default function DashboardSelector() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [dashboardOptions, setDashboardOptions] = useState<DashboardOption[]>([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [allRoles, setAllRoles] = useState<string[]>([])
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  
  const userRole = session?.user?.role || ''
  
  // Fallback function in case API fails - DEFINE BEFORE USE
  const getFallbackOptions = (role: string): DashboardOption[] => {
    const options: DashboardOption[] = []
    
    if (['MEMBER_FREE', 'MEMBER_PREMIUM', 'AFFILIATE', 'MENTOR'].includes(role)) {
      options.push({
        id: 'member',
        title: 'Member Area',
        description: 'Akses kursus, materi, dan fitur membership Anda',
        icon: User,
        href: '/dashboard?selected=member',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 border-blue-200',
        ...dashboardConfigs.member,
      } as DashboardOption)
    }
    
    if (role === 'AFFILIATE') {
      options.push({
        id: 'affiliate',
        title: 'Rich Affiliate',
        description: 'Kelola affiliate earnings, track referral links, dan lihat komisi Anda',
        icon: DollarSign,
        href: '/affiliate/dashboard',
        color: 'text-green-600',
        bgColor: 'bg-green-50 border-green-200',
        ...dashboardConfigs.affiliate,
      } as DashboardOption)
    }
    
    if (role === 'MENTOR') {
      options.push({
        id: 'mentor',
        title: 'Mentor Hub',
        description: 'Buat kursus, kelola siswa, dan pantau progress pembelajaran',
        icon: GraduationCap,
        href: '/mentor/dashboard',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50 border-purple-200',
        ...dashboardConfigs.mentor,
      } as DashboardOption)
    }
    
    return options
  }
  
  // Fetch dashboard options - NO AUTO REDIRECT
  useEffect(() => {
    const fetchDashboardOptions = async () => {
      if (!session?.user?.id || status !== 'authenticated') return
      
      try {
        const response = await fetch('/api/user/dashboard-options')
        const data = await response.json()
        
        if (!response.ok) {
          console.error('Error fetching dashboard options:', data)
          setDashboardOptions(getFallbackOptions(userRole))
          setIsLoadingOptions(false)
          return
        }
        
        if (data.success && data.dashboardOptions) {
          const options: DashboardOption[] = data.dashboardOptions.map((opt: ApiDashboardOption) => ({
            ...opt,
            icon: iconMap[opt.icon] || User,
            ...dashboardConfigs[opt.id] || dashboardConfigs.member,
          }))
          
          setDashboardOptions(options)
          setAllRoles(data.allRoles || [])
        }
      } catch (error) {
        console.error('Error fetching dashboard options:', error)
        setDashboardOptions(getFallbackOptions(userRole))
      } finally {
        setIsLoadingOptions(false)
      }
    }
    
    fetchDashboardOptions()
  }, [session?.user?.id, status, userRole])
  
  // Redirect to login if no session
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/login')
    }
  }, [status, router])
  
  // Loading state
  if (status === 'loading' || isLoadingOptions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/30 rounded-full animate-spin border-t-blue-500 mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-blue-400 mx-auto opacity-20"></div>
          </div>
          <p className="text-blue-200 mt-4 text-sm">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  // No session
  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500/30 rounded-full animate-spin border-t-blue-500"></div>
      </div>
    )
  }

  const handleDashboardSelect = async (option: DashboardOption) => {
    setLoading(option.id)
    
    try {
      await fetch('/api/user/preferred-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dashboardType: option.id })
      })
    } catch (error) {
      console.error('Error saving preference:', error)
    }
    
    router.push(option.href)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-500/20 mb-4">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-200">Pilih Dashboard Anda</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 md:mb-4">
            Selamat Datang, {session.user.name || 'User'}!
          </h1>
          
          <p className="text-base md:text-lg text-blue-100/80 max-w-2xl mx-auto px-4">
            Pilih dashboard yang ingin Anda akses berdasarkan role Anda
          </p>
          
          {allRoles.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="text-sm text-blue-200/60">Role Anda:</span>
              {allRoles.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center gap-1 bg-white/5 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10 text-xs text-white/80"
                >
                  <Shield className="w-3 h-3" />
                  {role}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Dashboard Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto mb-8">
          {dashboardOptions.map((option) => {
            const Icon = option.icon
            const isHovered = hoveredCard === option.id
            const isLoading = loading === option.id
            
            return (
              <button
                key={option.id}
                onClick={() => handleDashboardSelect(option)}
                onMouseEnter={() => setHoveredCard(option.id)}
                onMouseLeave={() => setHoveredCard(null)}
                disabled={isLoading}
                className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${option.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`}></div>
                
                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 ${option.iconBg} rounded-xl mb-4 md:mb-6 transition-transform duration-300 ${isHovered ? 'scale-110 rotate-6' : ''}`}>
                    <Icon className={`w-7 h-7 md:w-8 md:h-8 ${option.color}`} />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-3">
                    {option.title}
                  </h3>
                  
                  <p className="text-sm md:text-base text-blue-100/70 mb-4 md:mb-6 line-clamp-2">
                    {option.description}
                  </p>
                  
                  {/* Features */}
                  {option.features && option.features.length > 0 && (
                    <ul className="space-y-2 mb-4 md:mb-6">
                      {option.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-xs md:text-sm text-blue-200/60">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  {/* CTA */}
                  <div className="flex items-center justify-between">
                    {isLoading ? (
                      <div className="flex items-center gap-2 text-blue-400">
                        <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
                        <span className="text-sm">Loading...</span>
                      </div>
                    ) : (
                      <span className="text-blue-400 text-sm font-medium flex items-center gap-2 group-hover:gap-3 transition-all">
                        Buka Dashboard
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Logout Button */}
        <div className="text-center">
          <button
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 hover:border-white/20 text-white transition-all duration-300 group"
          >
            <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </div>
  )
}
