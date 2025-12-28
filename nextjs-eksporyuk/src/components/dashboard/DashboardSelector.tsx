'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { User, DollarSign, GraduationCap, Shield, BarChart3 } from 'lucide-react'

interface DashboardOption {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  href: string
  color: string
  bgColor: string
}

export default function DashboardSelector() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const userRole = session?.user?.role || ''
  
  // Define available dashboards based on user roles - use useMemo to avoid recalculating
  // NOTE: Admin should NOT reach this page - they go straight to /admin via middleware
  const dashboardOptions = useMemo((): DashboardOption[] => {
    if (!userRole) return []
    
    // Admin should not see this selector - redirect via useEffect below
    if (userRole === 'ADMIN') return []
    
    const options: DashboardOption[] = []
    
    // Member dashboard for member/affiliate/mentor roles
    if (['MEMBER_FREE', 'MEMBER_PREMIUM', 'AFFILIATE', 'MENTOR'].includes(userRole)) {
      options.push({
        id: 'member',
        title: 'Member Dashboard', 
        description: 'Akses kursus, materi, dan fitur membership Anda',
        icon: User,
        href: '/dashboard',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 border-blue-200'
      })
    }
    
    // Affiliate dashboard
    if (userRole === 'AFFILIATE') {
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
    
    // Mentor dashboard
    if (userRole === 'MENTOR') {
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
  }, [userRole])
  
  // Admin redirect - they shouldn't be here, send to /admin
  useEffect(() => {
    if (userRole === 'ADMIN') {
      router.push('/admin')
    }
  }, [userRole, router])
  
  // Auto-redirect if only one option - hook BEFORE conditional returns
  useEffect(() => {
    if (dashboardOptions.length === 1) {
      const timer = setTimeout(() => {
        router.push(dashboardOptions[0].href)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [dashboardOptions, router])
  
  // Redirect to login if no session - after all hooks
  useEffect(() => {
    if (status !== 'loading' && !session?.user) {
      router.push('/login')
    }
  }, [status, session, router])
  
  // Loading state
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  }

  // No session - show loading while redirecting
  if (!session?.user) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  }
  
  // Admin should not see this page - show loading while redirecting
  if (userRole === 'ADMIN') {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Mengarahkan ke Admin Panel...</p>
      </div>
    </div>
  }

  const handleDashboardSelect = async (option: DashboardOption) => {
    setLoading(true)
    
    // Optional: Save user preference
    try {
      await fetch('/api/user/set-preferred-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dashboardType: option.id })
      })
    } catch (error) {
      console.log('Could not save preference:', error)
    }
    
    router.push(option.href)
  }

  // Single option - show loading
  if (dashboardOptions.length === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <img src="/logo.png" alt="Platform" className="h-8 w-auto" />
              <span className="text-xl font-semibold text-gray-900">Platform Name</span>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Help Center</div>
              <div className="text-sm font-medium text-gray-900">
                {session.user.name || session.user.email} • Premium Member
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome Back, {session.user.name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            You are signed in. Select a dashboard below to manage your activities.
          </p>
        </div>

        {/* Dashboard Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {dashboardOptions.map((option) => {
            const IconComponent = option.icon
            return (
              <button
                key={option.id}
                onClick={() => handleDashboardSelect(option)}
                disabled={loading}
                className={`
                  relative overflow-hidden rounded-2xl border-2 p-6 text-left
                  hover:scale-105 hover:shadow-lg transform transition-all duration-200
                  focus:outline-none focus:ring-4 focus:ring-blue-500/20
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${option.bgColor}
                `}
                style={{
                  backgroundImage: option.id === 'affiliate' 
                    ? "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><circle cx=\"80\" cy=\"20\" r=\"8\" fill=\"%23059669\" opacity=\"0.3\"/><circle cx=\"20\" cy=\"80\" r=\"12\" fill=\"%23059669\" opacity=\"0.2\"/></svg>')"
                    : option.id === 'member'
                    ? "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect x=\"10\" y=\"30\" width=\"30\" height=\"20\" rx=\"4\" fill=\"%232563eb\" opacity=\"0.2\"/><rect x=\"60\" y=\"50\" width=\"25\" height=\"15\" rx=\"3\" fill=\"%232563eb\" opacity=\"0.3\"/></svg>')"
                    : ''
                }}
              >
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${option.bgColor} border mb-4`}>
                  <IconComponent className={`w-6 h-6 ${option.color}`} />
                </div>
                
                {/* Content */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {option.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {option.description}
                </p>
                
                {/* CTA Button */}
                <div className="mt-4">
                  <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white 
                    ${option.id === 'affiliate' ? 'bg-green-600 hover:bg-green-700' :
                      option.id === 'admin' ? 'bg-red-600 hover:bg-red-700' :
                      option.id === 'mentor' ? 'bg-purple-600 hover:bg-purple-700' :
                      'bg-blue-600 hover:bg-blue-700'}
                    transition-colors`}>
                    {option.id === 'affiliate' ? '💰 Access Dashboard' : 
                     option.id === 'mentor' ? '📚 Go to Dashboard' :
                     option.id === 'admin' ? '⚡ Manage Platform' :
                     '🏠 Go to Dashboard'}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 space-x-4">
          <button className="hover:text-gray-700">❓ Need Help?</button>
          <button className="hover:text-gray-700">👤 My Profile</button>
          <button className="hover:text-gray-700">🚪 Sign Out</button>
        </div>
        
        <div className="text-center mt-4 text-xs text-gray-400">
          © 2023 Platform Name. All rights reserved.
        </div>
      </div>
    </div>
  )
}