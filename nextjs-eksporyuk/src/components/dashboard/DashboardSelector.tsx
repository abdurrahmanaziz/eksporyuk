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
  
  // Fetch dashboard options from API based on ALL user roles in database
  useEffect(() => {
    const fetchDashboardOptions = async () => {
      if (!session?.user?.id) return
      
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
          // Convert API options to component format with rich styling
          const options: DashboardOption[] = data.dashboardOptions.map((opt: ApiDashboardOption) => ({
            ...opt,
            icon: iconMap[opt.icon] || User,
            ...dashboardConfigs[opt.id] || dashboardConfigs.member,
          }))
          
          setDashboardOptions(options)
          setAllRoles(data.allRoles || [])
          
          // If user has preferred dashboard and it's available, redirect
          if (data.preferredDashboard) {
            const preferred = options.find((o: DashboardOption) => o.id === data.preferredDashboard)
            if (preferred) {
              // Add small delay to ensure session is fully established
              setTimeout(() => {
                router.push(preferred.href)
              }, 100)
              return
            }
          }
          
          // Auto-redirect if only one option (add small delay)
          if (options.length === 1) {
            setTimeout(() => {
              router.push(options[0].href)
            }, 100)
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard options:', error)
        setDashboardOptions(getFallbackOptions(userRole))
      } finally {
        setIsLoadingOptions(false)
      }
    }
    
    if (session?.user?.id && status === 'authenticated') {
      fetchDashboardOptions()
    }
  }, [session?.user?.id, status, router])
  
  // Fallback function in case API fails
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
  
  // Admin redirect
  useEffect(() => {
    if (userRole === 'ADMIN') {
      router.push('/admin')
    }
  }, [userRole, router])
  
  // Redirect to login if no session
  useEffect(() => {
    if (status !== 'loading' && !session?.user) {
      router.push('/login')
    }
  }, [status, session?.user, router])
  
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
  
  // Admin redirect
  if (userRole === 'ADMIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500/30 rounded-full animate-spin border-t-red-500 mx-auto"></div>
          <p className="text-red-200 mt-4">Mengarahkan ke Admin Panel...</p>
        </div>
      </div>
    )
  }

  const handleDashboardSelect = async (option: DashboardOption) => {
    setLoading(option.id)
    
    try {
      await fetch('/api/user/set-preferred-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dashboardType: option.id })
      })
    } catch (error) {
      console.error('Error saving preference:', error)
    }
    
    router.push(option.href)
  }

  // Single option - redirect
  if (dashboardOptions.length === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 rounded-full animate-spin border-t-blue-500 mx-auto"></div>
          <h2 className="text-xl font-semibold text-white mt-4">Mengarahkan ke Dashboard...</h2>
          <p className="text-blue-200 mt-2">{dashboardOptions[0].title}</p>
        </div>
      </div>
    )
  }

  const displayName = session.user.name?.split(' ')[0] || 'User'
  const fullName = session.user.name || session.user.email || 'User'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="px-4 py-4 sm:px-6 sm:py-5">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Eksporyuk" className="h-8 sm:h-10 w-auto" />
              <span className="text-lg sm:text-xl font-bold text-white hidden sm:block">Eksporyuk</span>
            </div>
            
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6">
          <div className="max-w-4xl w-full">
            {/* Welcome Section */}
            <div className="text-center mb-8 sm:mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-blue-300 text-sm mb-4">
                <Sparkles className="w-4 h-4" />
                <span>Selamat Datang Kembali</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
                Halo, <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{displayName}</span>! 👋
              </h1>
              
              <p className="text-base sm:text-lg text-blue-200/80 max-w-md mx-auto">
                Pilih dashboard yang ingin Anda akses hari ini
              </p>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
              {dashboardOptions.map((option) => {
                const IconComponent = option.icon
                const isLoading = loading === option.id
                const isHovered = hoveredCard === option.id
                
                return (
                  <button
                    key={option.id}
                    onClick={() => handleDashboardSelect(option)}
                    onMouseEnter={() => setHoveredCard(option.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    disabled={loading !== null}
                    className={`
                      relative group overflow-hidden rounded-2xl sm:rounded-3xl p-1 text-left
                      transform transition-all duration-300 ease-out
                      ${isHovered ? 'scale-105 shadow-2xl shadow-blue-500/30' : 'scale-100'}
                      ${loading !== null ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      focus:outline-none focus:ring-4 focus:ring-blue-500/40
                    `}
                  >
                    {/* Gradient Border */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${option.gradient} opacity-80 rounded-2xl sm:rounded-3xl`}></div>
                    
                    {/* Card Content */}
                    <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-6 h-full">
                      {/* Loading Overlay */}
                      {isLoading && (
                        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-20 rounded-2xl sm:rounded-3xl">
                          <div className="w-10 h-10 border-3 border-white/30 rounded-full animate-spin border-t-white"></div>
                        </div>
                      )}

                      {/* Top Row: Icon + Arrow */}
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br ${option.gradient} flex items-center justify-center shadow-2xl`}>
                          <IconComponent className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={1.5} />
                        </div>
                        
                        <div className={`
                          w-12 h-12 rounded-full bg-white/10 flex items-center justify-center
                          transition-all duration-300
                          ${isHovered ? 'bg-white/20 translate-x-1.5 shadow-xl' : ''}
                        `}>
                          <ArrowRight className={`w-6 h-6 text-white transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} strokeWidth={2} />
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                        {option.title}
                      </h3>
                      <p className="text-sm sm:text-base text-slate-400 mb-4 line-clamp-2">
                        {option.description}
                      </p>

                      {/* Features Tags */}
                      <div className="flex flex-wrap gap-2">
                        {option.features?.map((feature, idx) => (
                          <span
                            key={idx}
                            className={`
                              inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                              bg-gradient-to-r ${option.gradient} bg-opacity-20 text-white/90
                              border border-white/10
                            `}
                          >
                            {feature}
                          </span>
                        ))}
                      </div>

                      {/* Hover Glow Effect */}
                      <div className={`
                        absolute inset-0 bg-gradient-to-br ${option.gradient} opacity-0 
                        group-hover:opacity-10 transition-opacity duration-300 rounded-2xl sm:rounded-3xl
                      `}></div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Role Info */}
            <div className="text-center">
              <p className="text-sm text-slate-500">
                Login sebagai <span className="text-blue-400">{fullName}</span>
              </p>
              <div className="flex items-center justify-center gap-2 mt-2">
                {allRoles.map((role, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-xs text-blue-300"
                  >
                    {role.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-4 py-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xs text-slate-600">
              © 2025 Eksporyuk. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}